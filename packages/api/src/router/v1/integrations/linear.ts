import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { linearWebhooksTable } from "@kokoro/db/schema";
import { LINEAR } from "@kokoro/validators/db";
import { ORPCError } from "@orpc/server";
import { os, integrationAccountMiddleware } from "../../../orpc";

export const v1IntegrationsLinearRouter = os.v1.integrations.linear.router({
  getWebhookStatus: os.v1.integrations.linear.getWebhookStatus
    .use(integrationAccountMiddleware)
    .handler(async ({ context }) => {
      const { integrationAccount } = context;

      if (
        integrationAccount.integrationType !== LINEAR ||
        !integrationAccount.platformData ||
        !("workspaceId" in integrationAccount.platformData)
      ) {
        throw new ORPCError("BAD_REQUEST");
      }

      const [webhook] = await db
        .select()
        .from(linearWebhooksTable)
        .where(
          eq(
            linearWebhooksTable.workspaceId,
            integrationAccount.platformData.workspaceId,
          ),
        );

      if (!webhook) {
        return {
          status: "not_created",
        } as const;
      }

      return {
        status: webhook.state,
      } as const;
    }),
  setupWebhook: os.v1.integrations.linear.setupWebhook
    .use(integrationAccountMiddleware)
    .handler(async ({ context, input }) => {
      const { integrationAccount } = context;

      if (
        integrationAccount.integrationType !== LINEAR ||
        !integrationAccount.platformData ||
        !("workspaceId" in integrationAccount.platformData)
      ) {
        throw new ORPCError("BAD_REQUEST");
      }

      await db
        .insert(linearWebhooksTable)
        .values({
          workspaceId: integrationAccount.platformData.workspaceId,
          secret: input.webhookSecret,
        })
        .onConflictDoUpdate({
          target: [linearWebhooksTable.workspaceId],
          set: {
            secret: input.webhookSecret,
            state: "unknown",
          },
        });

      return { success: true };
    }),
});
