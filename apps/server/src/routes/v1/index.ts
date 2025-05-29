import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { pinoLogger } from "hono-pino";

import crypto from "node:crypto";
import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { authCodeTable, oauthClientTable, tokenTable } from "@kokoro/db/schema";
import { createAccessToken } from "@kokoro/jwt";
import { logger } from "../../logger";

export const v1OauthRouter = new OpenAPIHono();

v1OauthRouter.use(
  "*",
  pinoLogger({
    pino: logger.child({
      subrouter: "v1-rest-api",
    }),
  }),
);

const v1TokenRoute = createRoute({
  method: "post",
  path: "/oauth/token",
  request: {
    headers: z.object({
      "content-type": z.literal("application/x-www-form-urlencoded"),
      authorization: z.string().optional(),
    }),
    body: {
      content: {
        "application/x-www-form-urlencoded": {
          schema: z
            .object({
              grant_type: z.enum(["authorization_code", "refresh_token"]),
              code: z.string().optional(),
              redirect_uri: z.string().optional(),
              code_verifier: z.string().optional(),
              refresh_token: z.string().optional(),
              scope: z.string().optional(),
              client_id: z.string().optional(),
              client_secret: z.string().optional(),
            })
            .refine(
              (d) => {
                if (d.grant_type === "authorization_code") {
                  return !!(d.code && d.redirect_uri);
                }
                if (d.grant_type === "refresh_token") {
                  return !!d.refresh_token;
                }
                return false;
              },
              {
                message:
                  "Missing required parameters for the selected grant_type",
              },
            ),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            access_token: z.string(),
            refresh_token: z.string().optional(),
            scope: z.string(),
            token_type: z.literal("Bearer"),
            expires_in: z.number(),
          }),
        },
      },
      description: "The token response",
    },
    400: { description: "Invalid request or parameters" },
    401: { description: "Invalid client credentials" },
    403: { description: "Invalid grant or token expired" },
  },
});

v1OauthRouter.openapi(v1TokenRoute, async (c) => {
  let clientId: string | undefined;
  let clientSecret: string | undefined;
  const headerAuthorization = c.req.header("authorization");
  const body = c.req.valid("form");

  if (headerAuthorization?.startsWith("Basic ")) {
    const [id, secret] = Buffer.from(headerAuthorization.slice(6), "base64")
      .toString()
      .split(":");
    clientId = id;
    clientSecret = secret;
  } else {
    clientId = body.client_id;
    clientSecret = body.client_secret;
  }

  if (!clientId) {
    return c.json({ error: "invalid_client" }, 401);
  }

  const [client] = await db
    .select()
    .from(oauthClientTable)
    .where(eq(oauthClientTable.clientId, clientId));

  if (!client || (clientSecret && client.clientSecret !== clientSecret)) {
    return c.json({ error: "invalid_client" }, 401);
  }

  const grant_type = body.grant_type;

  // --- Handle each grant ---
  if (grant_type === "authorization_code") {
    const code = body.code;
    const redirect_uri = body.redirect_uri;
    const code_verifier = body.code_verifier;
    const scope = body.scope;

    if (!code || !redirect_uri) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const isPublicClient = !clientSecret;

    // PKCE validation: Required for public clients, optional for confidential clients
    if (isPublicClient && !code_verifier) {
      return c.json(
        {
          error: "invalid_request",
          error_description: "code_verifier is required for public clients",
        },
        400,
      );
    }

    // 4a. Verify auth code
    const [authCode] = await db
      .select()
      .from(authCodeTable)
      .where(eq(authCodeTable.code, code));

    if (
      !authCode ||
      authCode.expiresAt < new Date() ||
      authCode.redirectUri !== redirect_uri
    ) {
      return c.json({ error: "invalid_grant" }, 403);
    }

    // PKCE verification: If auth code has PKCE challenge, we must verify it
    if (authCode.codeChallenge) {
      if (!code_verifier) {
        return c.json(
          {
            error: "invalid_grant",
            error_description: "code_verifier required for PKCE",
          },
          403,
        );
      }

      if (
        !verifyPKCE(
          {
            codeChallenge: authCode.codeChallenge,
            codeChallengeMethod: authCode.codeChallengeMethod,
          },
          code_verifier,
        )
      ) {
        return c.json({ error: "invalid_grant" }, 403);
      }
    }

    // 5a. Issue tokens
    const atExpiresIn = 3600;
    const accessToken = await createAccessToken(
      { sub: authCode.userId, aud: clientId },
      { expiresIn: `${atExpiresIn}s` },
    );
    const refreshToken = crypto.randomBytes(32).toString("hex");

    await db.transaction(async (tx) => {
      await tx.insert(tokenTable).values({
        accessToken,
        refreshToken,
        clientId: client.id,
        userId: authCode.userId,
        scope: scope ?? authCode.scope,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + atExpiresIn * 1000),
      });
      await tx.delete(authCodeTable).where(eq(authCodeTable.code, code));
    });

    return c.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: atExpiresIn,
        refresh_token: refreshToken,
        scope: scope ?? authCode.scope,
      },
      200,
    );
  }

  if (grant_type === "refresh_token") {
    const refresh_token = body.refresh_token;
    const scope = body.scope;

    if (!refresh_token) {
      return c.json({ error: "invalid_request" }, 400);
    }

    // 4b. Verify refresh token
    const [existing] = await db
      .select()
      .from(tokenTable)
      .where(eq(tokenTable.refreshToken, refresh_token));

    if (!existing || !existing.userId) {
      return c.json({ error: "invalid_grant" }, 403);
    }

    // 5b. Issue new tokens
    const atExpiresIn = 3600;
    const newAccessToken = await createAccessToken(
      { sub: existing.userId, aud: clientId },
      { expiresIn: `${atExpiresIn}s` },
    );
    const newRefreshToken = crypto.randomBytes(32).toString("hex");

    await db.transaction(async (tx) => {
      // optionally revoke the old refresh token
      await tx
        .delete(tokenTable)
        .where(eq(tokenTable.refreshToken, refresh_token));

      await tx.insert(tokenTable).values({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        clientId: client.id,
        userId: existing.userId,
        scope: scope ?? existing.scope,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + atExpiresIn * 1000),
      });
    });

    return c.json(
      {
        access_token: newAccessToken,
        token_type: "Bearer",
        expires_in: atExpiresIn,
        refresh_token: newRefreshToken,
        scope: scope ?? existing.scope,
      },
      200,
    );
  }

  // should never reach here thanks to Zod guard
  return c.json({ error: "unsupported_grant_type" }, 400);
});

// --- PKCE helper ---
function verifyPKCE(
  authCode: { codeChallenge: string; codeChallengeMethod: string | null },
  verifier: string,
) {
  if (authCode.codeChallengeMethod === "S256") {
    const hash = crypto.createHash("sha256").update(verifier).digest();
    const b64 = hash
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    return b64 === authCode.codeChallenge;
  }
  // plain
  return verifier === authCode.codeChallenge;
}
