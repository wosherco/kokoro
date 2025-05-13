import * as Sentry from "@sentry/bun";
import { GaxiosError } from "gaxios";
import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { err, ok } from "neverthrow";

import { eq } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db as dbClient } from "@kokoro/db/client";
import { integrationsAccountsTable, userTable } from "@kokoro/db/schema";
import { sendGoogleCalendarInvalidGrantEmail } from "@kokoro/email";
import type { GoogleCalendarIntegrationPlatformData } from "@kokoro/validators/db";
import { GOOGLE_CALENDAR, GOOGLE_PEOPLE } from "@kokoro/validators/db";

import { env } from "../env";

export type GoogleClient = OAuth2Client;

export interface GoogleAccount {
  oauth2Client: GoogleClient;
  platformAccountId: string;
  /**
   * User ID from Kokoro, not from Google.
   */
  userId: string;
  integrationAccountId: string;
  platformData?: GoogleCalendarIntegrationPlatformData;
  /**
   * Transaction from the DB account lock.<br>
   *! <b>TRY NOT TO USE IT.</b>
   */
  tx: TransactableDBType;
}

interface GoogleClientConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

type GoogleAccountType = typeof GOOGLE_CALENDAR | typeof GOOGLE_PEOPLE;

const googleClientConfigs: Record<GoogleAccountType, GoogleClientConfig> = {
  [GOOGLE_CALENDAR]: {
    clientId: env.ACCOUNT_GOOGLE_CLIENT_ID,
    clientSecret: env.ACCOUNT_GOOGLE_CLIENT_SECRET,
    callbackUrl: env.ACCOUNT_GOOGLE_CALLBACK_URL,
  },
  [GOOGLE_PEOPLE]: {
    clientId: env.ACCOUNT_PEOPLEAPI_CLIENT_ID,
    clientSecret: env.ACCOUNT_PEOPLEAPI_CLIENT_SECRET,
    callbackUrl: env.ACCOUNT_PEOPLEAPI_CALLBACK_URL,
  },
} as const;

export async function withGoogleAccount<T>(
  integrationAccountId: string,
  type: GoogleAccountType,
  callback: (oauth2Client: GoogleAccount) => Promise<T>,
): Promise<T> {
  const res = await dbClient.transaction(async (tx) => {
    const googleClientConfig = googleClientConfigs[type];

    const oauth2Client = new google.auth.OAuth2(
      googleClientConfig.clientId,
      googleClientConfig.clientSecret,
      googleClientConfig.callbackUrl,
    );

    const [dbDetails] = await tx
      .select({
        platformAccountId: integrationsAccountsTable.platformAccountId,
        userId: integrationsAccountsTable.userId,
        accessToken: integrationsAccountsTable.accessToken,
        refreshToken: integrationsAccountsTable.refreshToken,
        expiresAt: integrationsAccountsTable.expiresAt,
        platformData: integrationsAccountsTable.platformData,
      })
      .from(integrationsAccountsTable)
      .where(eq(integrationsAccountsTable.id, integrationAccountId));

    if (!dbDetails) {
      throw new Error("Google account not found");
    }

    oauth2Client.on("tokens", (tokens) => {
      if (tokens.access_token) {
        void dbClient
          .update(integrationsAccountsTable)
          .set({
            accessToken: tokens.access_token,
            expiresAt: tokens.expiry_date
              ? new Date(tokens.expiry_date)
              : undefined,
          })
          .where(eq(integrationsAccountsTable.id, integrationAccountId))
          .execute();
      }
    });

    oauth2Client.setCredentials({
      access_token: dbDetails.accessToken,
      refresh_token: dbDetails.refreshToken,
      expiry_date: dbDetails.expiresAt.getTime(),
    });

    const googlePlatformData =
      dbDetails.platformData as GoogleCalendarIntegrationPlatformData | null;

    const googleAccount: GoogleAccount = {
      oauth2Client,
      platformAccountId: dbDetails.platformAccountId,
      userId: dbDetails.userId,
      integrationAccountId,
      platformData: googlePlatformData ?? undefined,
      tx,
    };

    try {
      return ok(await callback(googleAccount));
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          api: "google",
        },
      });

      if (error instanceof GaxiosError) {
        await handleGoogleError(tx, googleAccount, error);
      }

      return err(error as Error);
    }
  });

  if (res.isErr()) {
    throw res.error;
  }

  return res.value;
}

export async function handleGoogleError(
  db: TransactableDBType,
  googleAccount: GoogleAccount,
  error: GaxiosError,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (error.response?.data?.error === "invalid_grant") {
    // If it's bad grant, register it
    await db.transaction(async (tx) => {
      const [prev] = await tx
        .select({
          invalidGrant: integrationsAccountsTable.invalidGrant,
          email: userTable.email,
          googleAccountEmail: integrationsAccountsTable.email,
        })
        .from(integrationsAccountsTable)
        .innerJoin(
          userTable,
          eq(integrationsAccountsTable.userId, userTable.id),
        )
        .where(
          eq(integrationsAccountsTable.id, googleAccount.integrationAccountId),
        );

      if (prev && !prev.invalidGrant) {
        await tx
          .update(integrationsAccountsTable)
          .set({ invalidGrant: true })
          .where(
            eq(
              integrationsAccountsTable.id,
              googleAccount.integrationAccountId,
            ),
          );

        await sendGoogleCalendarInvalidGrantEmail(
          prev.email,
          prev.googleAccountEmail,
        );
      }
    });

    return ok(true);
  }

  return err(error);
}
