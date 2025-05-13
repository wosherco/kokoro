import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { authCodeTable, oauthClientTable } from "@kokoro/db/schema";
import {
  type OauthAuthorizeTokenPayload,
  OauthAuthorizeTokenPayloadSchema,
  createOauthAuthorizeToken,
  verifyOauthAuthorizeToken,
} from "@kokoro/jwt";
import { OAUTH_SCOPES } from "@kokoro/validators/db";
import { error, redirect } from "@sveltejs/kit";
import { nanoid } from "nanoid";
import type { Actions, PageServerLoad } from "./$types";
export const load: PageServerLoad = async ({ url, locals, cookies }) => {
  const parsedQuery = await OauthAuthorizeTokenPayloadSchema.safeParseAsync({
    response_type: url.searchParams.get("response_type"),
    client_id: url.searchParams.get("client_id"),
    redirect_uri: url.searchParams.get("redirect_uri"),
    scope: url.searchParams.get("scope")?.split(" "),
    state: url.searchParams.get("state"),
    code_challenge: url.searchParams.get("code_challenge"),
    code_challenge_method: url.searchParams.get("code_challenge_method"),
  });

  let payload: OauthAuthorizeTokenPayload;

  if (!parsedQuery.success) {
    try {
      // Checking if we have something saved in the cookie
      const token = cookies.get("oauth_authorize_token");
      if (!token) {
        throw error(400, "Invalid query");
      }

      payload = await verifyOauthAuthorizeToken(token);
    } catch {
      throw error(400, "Invalid query");
    }
  } else {
    payload = parsedQuery.data;
    // Saving it to the cookie
    const dataToken = await createOauthAuthorizeToken(payload, {
      expiresIn: "5m",
    });
    cookies.set("oauth_authorize_token", dataToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 10, // 10 minutes
    });
  }

  const [client] = await db
    .select()
    .from(oauthClientTable)
    .where(eq(oauthClientTable.clientId, payload.client_id));

  if (!client) {
    throw error(400, "Client not found");
  }

  if (!locals.auth.user) {
    throw redirect(302, "/?redirectTo=oauth");
  }

  const payloadScopes = new Set(payload.scope);

  if (OAUTH_SCOPES.some((scope) => !payloadScopes.has(scope))) {
    throw error(400, "Invalid scope");
  }

  // Sorting them to match the order/indexes of OAUTH_SCOPES
  const sortedScopes = OAUTH_SCOPES.filter((scope) => payloadScopes.has(scope));
  return {
    client: {
      name: client.name,
      scopes: sortedScopes,
    },
  };
};

export const actions: Actions = {
  default: async ({ cookies, locals }) => {
    if (!locals.auth.user) {
      throw redirect(302, "/?redirectTo=oauth");
    }
    const payloadToken = cookies.get("oauth_authorize_token");
    if (!payloadToken) {
      throw error(400, "Invalid query or token expired");
    }

    cookies.delete("oauth_authorize_token", {
      path: "/",
    });

    let payload: OauthAuthorizeTokenPayload;
    try {
      payload = await verifyOauthAuthorizeToken(payloadToken);
    } catch {
      throw error(400, "Invalid query or token expired");
    }

    const code = nanoid();
    await db.insert(authCodeTable).values({
      code,
      clientId: payload.client_id,
      userId: locals.auth.user.id,
      redirectUri: payload.redirect_uri,
      scope: payload.scope?.join(" "),
      expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
      codeChallenge: payload.code_challenge,
      codeChallengeMethod: payload.code_challenge_method,
    });

    const redirectUrl = new URL(payload.redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (payload.state) {
      redirectUrl.searchParams.set("state", payload.state);
    }

    throw redirect(302, redirectUrl.href);
  },
};
