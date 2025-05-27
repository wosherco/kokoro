import { env } from "$env/dynamic/private";
/* eslint-disable @typescript-eslint/only-throw-error */
import { throwIfReachedMaxIntegrationAccounts } from "@/server/integrations";
import * as Sentry from "@sentry/sveltekit";
import { error, isHttpError, redirect } from "@sveltejs/kit";
import { z } from "zod";

import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { contactListTable, integrationsAccountsTable } from "@kokoro/db/schema";
import { createLinearClient } from "@kokoro/linear/client";
import {
  CONTACTS_SYNC_QUEUE,
  TASKLIST_SYNC_QUEUE,
  publish,
} from "@kokoro/queues";
import {
  LINEAR,
  LINEAR_INTEGRATION,
  type LinearIntegrationPlatformData,
} from "@kokoro/validators/db";

import type { PageServerLoad } from "./$types";

const linearCodeResponse = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string(),
});

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
  // If not subscribed, we don't even care
  if (locals.stripeEnabled && !locals.subscribed) {
    throw error(403, "You're not subscribed");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies.get("linear_oauth_state");
  let redirectUrl: string | undefined;

  if (!state || !storedState || state !== storedState) {
    throw error(400, "Invalid state parameter");
  }

  const userId = locals.auth.user.id;

  // Clean up the state cookie
  cookies.delete("linear_oauth_state", { path: "/" });

  if (!code) {
    throw error(400, "No code parameter provided");
  }

  try {
    // Exchange code for access token with Linear
    const tokenResponse = await fetch("https://api.linear.app/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: env.ACCOUNT_LINEAR_CALLBACK_URL,
        client_id: env.ACCOUNT_LINEAR_CLIENT_ID,
        client_secret: env.ACCOUNT_LINEAR_CLIENT_SECRET,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      Sentry.captureException(errorData);
      console.error("Linear token exchange error:", errorData);
      throw error(400, "Failed to exchange code for token");
    }

    const tokenData = await tokenResponse
      .json()
      .then((data) => linearCodeResponse.safeParseAsync(data));

    if (!tokenData.success) {
      Sentry.captureException(tokenData.error);
      console.error("Linear token exchange error:", tokenData.error);
      throw error(400, "Failed to exchange code for token");
    }

    const accessToken = tokenData.data.access_token;

    // Fetch user information from Linear
    const userResponse = await createLinearClient(accessToken).viewer;

    const account = await db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select({
          userId: integrationsAccountsTable.userId,
        })
        .from(integrationsAccountsTable)
        .where(
          and(
            eq(integrationsAccountsTable.platformAccountId, userResponse.id),
            eq(integrationsAccountsTable.integrationType, LINEAR_INTEGRATION),
          ),
        );

      if (existingUser) {
        await throwIfReachedMaxIntegrationAccounts(userId, tx);
      }

      if (existingUser && existingUser.userId !== userId) {
        throw error(400, "User already exists");
      }

      const organization = await userResponse.organization;

      const linearPlatformData: LinearIntegrationPlatformData = {
        workspaceId: organization.id,
      };

      // Store the Linear integration in the database
      const [account] = await tx
        .insert(integrationsAccountsTable)
        .values({
          userId,
          integrationType: LINEAR_INTEGRATION,
          platformAccountId: userResponse.id,
          email: userResponse.email,
          platformDisplayName: userResponse.displayName,
          profilePicture: userResponse.avatarUrl,
          accessToken,
          expiresAt: new Date(Date.now() + tokenData.data.expires_in * 1000), // Set far future date since Linear tokens don't expire
          platformData: linearPlatformData,
        })
        .onConflictDoUpdate({
          target: [
            integrationsAccountsTable.platformAccountId,
            integrationsAccountsTable.integrationType,
          ],
          set: {
            email: userResponse.email,
            platformDisplayName: userResponse.displayName,
            profilePicture: userResponse.avatarUrl,
            accessToken,
            expiresAt: new Date(Date.now() + tokenData.data.expires_in * 1000),
            invalidGrant: false,
            platformData: linearPlatformData,
          },
        })
        .returning({
          id: integrationsAccountsTable.id,
        });

      if (!account) {
        throw error(500, "Failed to create Linear integration");
      }

      // Creating contact list for Linear workspace users
      await tx.insert(contactListTable).values({
        userId,
        integrationAccountId: account.id,
        source: LINEAR,
        platformAccountId: userResponse.id,
        platformContactListId: userResponse.id,
        name: "Workspace Users",
      });

      return account;
    });

    await Promise.all([
      publish(TASKLIST_SYNC_QUEUE, {
        integrationAccountId: account.id,
      }),
      publish(CONTACTS_SYNC_QUEUE, {
        source: LINEAR,
        integrationAccountId: account.id,
      }),
    ]);

    redirectUrl = `/integrations/account/${account.id}`;
  } catch (e) {
    if (isHttpError(e)) {
      throw e;
    }

    console.error("Error in Linear OAuth callback:", e);
    throw error(500, "Failed to complete Linear authentication");
  }

  throw redirect(302, redirectUrl);
};
