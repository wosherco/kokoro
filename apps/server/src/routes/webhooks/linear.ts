import { and, eq, sql } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import {
  contactListTable,
  integrationsAccountsTable,
  linearWebhooksTable,
  memoryTaskTable,
  tasklistsTable,
} from "@kokoro/db/schema";
import {
  LINEAR_WEBHOOK_SIGNATURE_HEADER,
  LINEAR_WEBHOOK_TS_FIELD,
  type LinearIssue,
  LinearWebhooks,
} from "@kokoro/linear";
import { CONTACTS_SYNC_QUEUE, TASK_SYNC_QUEUE, publish } from "@kokoro/queues";
import { LINEAR } from "@kokoro/validators/db";
import { Hono } from "hono";
import { z } from "zod";

interface LinearActor {
  id: string;
  name: string;
  email: string;
  type: "user";
}

interface LinearUserData {
  id: string;
  name: string;
  displayName: string;
  email: string;
  timezone?: string;
  guest: boolean;
  app: boolean;
  active: boolean;
  disableReason?: "invitePending" | "adminSuspended";
  admin: boolean;
}

interface LinearLabel {
  id: string;
  color: string;
  name: string;
}

interface LinearState {
  id: string;
  color: string;
  name: string;
  type: string;
}

interface LinearTeam {
  id: string;
  key: string;
  name: string;
}

interface LinearAssignee {
  id: string;
  name: string;
  email: string;
}

interface LinearIssueData {
  id: string;
  createdAt: string;
  updatedAt: string;
  number: number;
  title: string;
  priority: number;
  boardOrder: number;
  sortOrder: number;
  prioritySortOrder: number;
  canceledAt: string | null;
  slaType: string;
  addedToTeamAt: string;
  labelIds: string[];
  teamId: string;
  previousIdentifiers: string[];
  creatorId: string;
  assigneeId: string;
  stateId: string;
  reactionData: unknown[];
  priorityLabel: string;
  botActor: null;
  identifier: string;
  url: string;
  subscriberIds: string[];
  assignee: LinearAssignee;
  state: LinearState;
  team: LinearTeam;
  labels: LinearLabel[];
  description: string;
  descriptionData: string;
  trashed?: boolean;
}

interface BaseLinearWebhookPayload {
  action: "create" | "update" | "remove" | "set" | "highRisk" | "breached";
  type: "Issue" | "User";
  createdAt: string;
  url: string;
  webhookTimestamp: number;
  webhookId: string;
  organizationId: string;
  actor: LinearActor | null;
}

interface LinearIssueCreatePayload extends BaseLinearWebhookPayload {
  action: "create";
  type: "Issue";
  data: LinearIssueData;
}

interface LinearIssueUpdatePayload extends BaseLinearWebhookPayload {
  action: "update";
  type: "Issue";
  data: LinearIssueData;
  updatedFrom: {
    updatedAt: string;
    sortOrder: number;
    canceledAt: string | null;
    stateId: string;
  };
}

interface LinearIssueRemovePayload extends BaseLinearWebhookPayload {
  action: "remove";
  type: "Issue";
  data: LinearIssueData;
}

interface LinearUserCreatePayload extends BaseLinearWebhookPayload {
  action: "create";
  type: "User";
  data: LinearUserData;
}

interface LinearUserUpdatePayload extends BaseLinearWebhookPayload {
  action: "update";
  type: "User";
  data: LinearUserData;
  updatedFrom: {
    updatedAt: string;
    timezone: string | null;
  };
}

type LinearWebhookPayload =
  | LinearIssueCreatePayload
  | LinearIssueUpdatePayload
  | LinearIssueRemovePayload
  | LinearUserCreatePayload
  | LinearUserUpdatePayload;

// Allowed Linear IPs
const ALLOWED_IPS = [
  "35.231.147.226",
  "35.243.134.228",
  "34.140.253.14",
  "34.38.87.206",
];

const linearWebhook = new Hono();

linearWebhook.post("/:workspaceId", async (c) => {
  const clientIp =
    c.req.header("CF-Connecting-IP") ??
    c.req.header("x-forwarded-for") ??
    c.req.header("x-real-ip");

  if (!clientIp || !ALLOWED_IPS.includes(clientIp)) {
    return c.json({ error: "Unauthorized IP address" }, 403);
  }

  const signatureHeader = c.req.header(LINEAR_WEBHOOK_SIGNATURE_HEADER);

  if (!signatureHeader) {
    return c.json({ error: "Invalid payload" }, 400);
  }

  const workspaceId = c.req.param("workspaceId");

  // Checking if workspaceId is a valid uuid
  if (!z.string().uuid().safeParse(workspaceId).success) {
    return c.json({ error: "Invalid workspaceId" }, 400);
  }

  const [dbWebhook] = await db
    .select()
    .from(linearWebhooksTable)
    .where(eq(linearWebhooksTable.workspaceId, workspaceId));

  if (!dbWebhook) {
    return c.json({ error: "Webhook not found" }, 404);
  }

  if (dbWebhook.state === "invalid") {
    return c.json(
      {
        error:
          "Webhook is invalid. Please, update your secret on https://account.kokoro.ws",
      },
      400,
    );
  }

  const webhookClient = new LinearWebhooks(dbWebhook.secret);

  const arrayBuf = await c.req.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  const payload = JSON.parse(buf.toString()) as LinearWebhookPayload;

  const valid = webhookClient.verify(
    buf,
    signatureHeader,
    payload[LINEAR_WEBHOOK_TS_FIELD],
  );

  if (!valid) {
    await db
      .update(linearWebhooksTable)
      .set({
        state: "invalid",
      })
      .where(eq(linearWebhooksTable.id, dbWebhook.id));

    // TODO: Send an email or something?

    return c.json({ error: "Invalid payload" }, 400);
  }

  if (dbWebhook.state === "unknown") {
    await db
      .update(linearWebhooksTable)
      .set({
        state: "active",
      })
      .where(eq(linearWebhooksTable.id, dbWebhook.id));
  }

  // Return early with 200 status
  setImmediate(async () => {
    try {
      console.log("Processing Linear webhook:", payload);

      switch (payload.type) {
        case "Issue": {
          const issue = payload.data;

          if (payload.action === "remove") {
            await db
              .delete(memoryTaskTable)
              .where(
                and(
                  eq(memoryTaskTable.platformTaskId, issue.id),
                  eq(memoryTaskTable.source, LINEAR),
                ),
              );
          } else {
            const tasklists = await db
              .select({
                integrationAccountId: integrationsAccountsTable.id,
                tasklistId: tasklistsTable.id,
              })
              .from(tasklistsTable)
              .innerJoin(
                integrationsAccountsTable,
                eq(
                  tasklistsTable.integrationAccountId,
                  integrationsAccountsTable.id,
                ),
              )
              .where(
                and(
                  eq(integrationsAccountsTable.integrationType, LINEAR),
                  sql<boolean>`${integrationsAccountsTable.platformData}->>'workspaceId' = ${dbWebhook.workspaceId}`,
                  eq(tasklistsTable.platformTaskListId, issue.teamId),
                ),
              );

            // Pushing a sync of the task to all account in this workspace
            await Promise.all(
              tasklists.map(({ tasklistId, integrationAccountId }) =>
                publish(TASK_SYNC_QUEUE, {
                  integrationAccountId,
                  source: LINEAR,
                  tasklistId,
                  platformTaskId: issue.id,
                }),
              ),
            );
          }

          break;
        }
        case "User": {
          if (payload.action === "create" || payload.action === "update") {
            const integrationAccounts = await db
              .select({
                integrationAccountId: integrationsAccountsTable.id,
                contactListId: contactListTable.id,
              })
              .from(integrationsAccountsTable)
              .innerJoin(
                contactListTable,
                eq(
                  integrationsAccountsTable.id,
                  contactListTable.integrationAccountId,
                ),
              )
              .where(
                // There's only 1 contact list per linear account/workspace
                and(
                  eq(integrationsAccountsTable.integrationType, LINEAR),
                  sql<boolean>`${integrationsAccountsTable.platformData}->>'workspaceId' = ${dbWebhook.workspaceId}`,
                ),
              );

            await Promise.all(
              integrationAccounts.map(
                ({ integrationAccountId, contactListId }) =>
                  publish(CONTACTS_SYNC_QUEUE, {
                    integrationAccountId,
                    source: LINEAR,
                    contactListId,
                    platformContactId: payload.data.id,
                  }),
              ),
            );
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error processing Linear webhook:", error);
    }
  });

  return c.json({ message: "Webhook received" }, 200);
});

export { linearWebhook };
