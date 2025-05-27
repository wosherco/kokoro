import * as jose from "jose";
import { z } from "zod";

import { OAUTH_SCOPES } from "@kokoro/validators/db";
import { env } from "../env";
const secret = new TextEncoder().encode(env.JWT_SECRET);

export const ChatTokenPayloadSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  chatId: z.string(),
  context: z.string().optional(),
  timezone: z.string(),
});

export type ChatTokenPayload = z.infer<typeof ChatTokenPayloadSchema>;

interface TokenParameters {
  expiresIn: number | string | Date;
}

async function createToken<T extends jose.JWTPayload>(
  payload: T,
  parameters: Partial<TokenParameters> = {}
) {
  const jwt = new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" }) // Algorithm to be used
    .setIssuedAt(); // Set issued at time
  if (parameters.expiresIn) {
    jwt.setExpirationTime(parameters.expiresIn);
  }

  return await jwt.sign(secret);
}

export class InvalidTokenPayloadContents extends Error {
  constructor() {
    super("Invalid token payload contents");
    this.name = "InvalidTokenPayloadContents";
  }
}

async function verifyToken<T>(schema: z.ZodSchema<T>, token: string) {
  const { payload } = await jose.jwtVerify<T>(token, secret);

  const parsedPayload = await schema.safeParseAsync(payload);

  if (!parsedPayload.success) {
    throw new InvalidTokenPayloadContents();
  }

  return payload;
}

export const AccessTokenPayloadSchema = z.object({
  sub: z.string(),
  aud: z.string(),
});

export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;

export async function createAccessToken(
  payload: AccessTokenPayload,
  parameters?: Partial<TokenParameters>
) {
  return await createToken(payload, parameters);
}

export async function verifyAccessToken(token: string) {
  return await verifyToken(AccessTokenPayloadSchema, token);
}

export const OauthAuthorizeTokenPayloadSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string(),
  redirect_uri: z.string(),
  scope: z.array(z.enum(OAUTH_SCOPES)),
  state: z.string().optional(),

  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(["S256", "plain"]).optional(),
});

export type OauthAuthorizeTokenPayload = z.infer<
  typeof OauthAuthorizeTokenPayloadSchema
>;

export async function createOauthAuthorizeToken(
  payload: OauthAuthorizeTokenPayload,
  parameters?: Partial<TokenParameters>
) {
  return await createToken(payload, parameters);
}

export async function verifyOauthAuthorizeToken(token: string) {
  return await verifyToken(OauthAuthorizeTokenPayloadSchema, token);
}
