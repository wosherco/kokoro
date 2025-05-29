export const OAUTH_SCOPES = [
  "openid",
  "read-memories",
  "write-memories",
] as const;

export const OAUTH_SCOPES_MAP: Record<(typeof OAUTH_SCOPES)[number], string> = {
  openid: "OpenID Connect",
  "read-memories": "Read Memories",
  "write-memories": "Write Memories",
} as const;
