import { env } from "$env/dynamic/private";
/* eslint-disable @typescript-eslint/only-throw-error */
import { throwIfReachedMaxIntegrationAccounts } from "@/server/integrations";
import { error, isHttpError, redirect } from "@sveltejs/kit";
import { google } from "googleapis";

import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { integrationsAccountsTable } from "@kokoro/db/schema";
import {
  CALENDARS_SYNC_QUEUE,
  GOOGLE_CALENDAR_WATCH_QUEUE,
  publish,
} from "@kokoro/queues";
import { GOOGLE_CALENDAR } from "@kokoro/validators/db";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
  // If not subscribed, we don't even care
  if (locals.stripeEnabled && !locals.subscribed) {
    throw error(403, "You're not subscribed");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies.get("google_oauth_state");
  let redirectUrl: string | undefined;

  if (!state || !storedState || state !== storedState) {
    throw error(400, "Invalid state parameter");
  }

  const userId = locals.auth.user.id;

  // Clean up the state cookie
  cookies.delete("google_oauth_state", { path: "/" });

  if (!code) {
    throw error(400, "No code parameter provided");
  }

  const oauth2Client = new google.auth.OAuth2(
    env.ACCOUNT_GOOGLE_CLIENT_ID,
    env.ACCOUNT_GOOGLE_CLIENT_SECRET,
    env.ACCOUNT_GOOGLE_CALLBACK_URL,
  );

  try {
    const [integrationAccount] = await db.transaction(async (tx) => {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Fetch userinfo
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
      });

      const { data: userInfo } = await oauth2.userinfo.get();

      const googleId = userInfo.id;
      const email = userInfo.email;
      const expiryDate = tokens.expiry_date;
      const accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;

      if (googleId === null || googleId === undefined) {
        throw error(400, "No user ID provided");
      }

      if (email === null || email === undefined) {
        throw error(400, "No email provided");
      }

      if (expiryDate === null || expiryDate === undefined) {
        throw error(400, "No expiry date provided");
      }

      if (accessToken === null || accessToken === undefined) {
        throw error(400, "No access token provided");
      }

      if (refreshToken === null || refreshToken === undefined) {
        throw error(400, "No refresh token provided");
      }

      const [existingUser] = await tx
        .select({
          userId: integrationsAccountsTable.userId,
        })
        .from(integrationsAccountsTable)
        .where(
          and(
            eq(integrationsAccountsTable.email, email),
            eq(integrationsAccountsTable.integrationType, GOOGLE_CALENDAR),
          ),
        );

      if (existingUser) {
        await throwIfReachedMaxIntegrationAccounts(userId, tx);
      }

      if (existingUser && existingUser.userId !== userId) {
        throw error(400, "User already exists");
      }

      // TODO: Send email to both emails to make sure they are the same, and know if just insterted, or just updated

      return tx
        .insert(integrationsAccountsTable)
        .values({
          platformAccountId: googleId,
          userId,
          integrationType: GOOGLE_CALENDAR,
          email,
          profilePicture: userInfo.picture,
          platformDisplayName: userInfo.name ?? email,
          accessToken,
          refreshToken,
          expiresAt: new Date(expiryDate),
        })
        .onConflictDoUpdate({
          target: [
            integrationsAccountsTable.platformAccountId,
            integrationsAccountsTable.integrationType,
          ],
          set: {
            email,
            profilePicture: userInfo.picture,
            platformDisplayName: userInfo.name ?? email,
            accessToken,
            refreshToken,
            expiresAt: new Date(expiryDate),
            invalidGrant: false,
          },
        })
        .returning({
          id: integrationsAccountsTable.id,
        });
    });

    if (!integrationAccount) {
      throw error(500, "Failed to create calendar link");
    }

    // Syncing
    await publish(CALENDARS_SYNC_QUEUE, {
      integrationAccountId: integrationAccount.id,
      source: GOOGLE_CALENDAR,
    });

    await publish(GOOGLE_CALENDAR_WATCH_QUEUE, {
      userId,
      integrationAccountId: integrationAccount.id,
    });

    redirectUrl = `/integrations/account/${integrationAccount.id}`;
  } catch (e) {
    if (isHttpError(e)) {
      throw e;
    }

    console.error("Error in Google OAuth callback:", e);
    throw error(500, "Failed to complete Google authentication");
  }

  throw redirect(302, redirectUrl);
};
