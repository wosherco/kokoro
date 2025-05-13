import type { LinearClient } from "@linear/sdk";
import * as Sentry from "@sentry/bun";
import { err, ok } from "neverthrow";

import { and, eq } from "@kokoro/db";
import { db as dbClient } from "@kokoro/db/client";
import { integrationsAccountsTable } from "@kokoro/db/schema";
import type { IntegrationAccountDetails } from "@kokoro/validators/integrations";

import { createLinearClient } from "./client";

export async function withLinear<T>(
  accountId: string,
  callback: (context: IntegrationAccountDetails<LinearClient>) => Promise<T>,
) {
  const res = await dbClient.transaction(async (tx) => {
    const [dbDetails] = await tx
      .select({
        platformAccountId: integrationsAccountsTable.platformAccountId,
        userId: integrationsAccountsTable.userId,
        accessToken: integrationsAccountsTable.accessToken,
        refreshToken: integrationsAccountsTable.refreshToken,
        expiresAt: integrationsAccountsTable.expiresAt,
      })
      .from(integrationsAccountsTable)
      .where(
        and(
          eq(integrationsAccountsTable.id, accountId),
          eq(integrationsAccountsTable.integrationType, "LINEAR"),
        ),
      );

    if (!dbDetails) {
      throw new Error("Google account not found");
    }

    // TODO: When implemented on Linear's side, the refresh token will be implemented.

    const linearClient = createLinearClient(dbDetails.accessToken);

    const linearAccount: IntegrationAccountDetails<LinearClient> = {
      platformAccountId: dbDetails.platformAccountId,
      userId: dbDetails.userId,
      client: linearClient,
    };

    try {
      return ok(await callback(linearAccount));
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          api: "google",
        },
      });

      // if (error instanceof GaxiosError) {
      //   await handleGoogleError(tx, googleAccount, error);
      // }

      return err(error as Error);
    }
  });

  if (res.isErr()) {
    throw res.error;
  }

  return res.value;
}

export type {
  Issue as LinearIssue,
  Team as LinearTeam,
  User as LinearUser,
} from "@linear/sdk";

export {
  LinearWebhooks,
  LINEAR_WEBHOOK_SIGNATURE_HEADER,
  LINEAR_WEBHOOK_TS_FIELD,
} from "@linear/sdk";
