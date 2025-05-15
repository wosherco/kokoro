import { getKeyValue, saveKeyValue } from "./kv";

// Keys for configuration
export const CONFIG_KEYS = {
  AUTH_TOKEN: "auth_token",
  AUTHENTICATOR_URL: "authenticator_url",
  SERVER_URL: "server_url",
};

/**
 * Configuration manager for kokoro-mcp
 */
export async function saveAuthToken(token: string | null): Promise<void> {
  await saveKeyValue(CONFIG_KEYS.AUTH_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return await getKeyValue(CONFIG_KEYS.AUTH_TOKEN, null);
}

export async function saveAuthenticatorUrl(url: string): Promise<void> {
  await saveKeyValue(CONFIG_KEYS.AUTHENTICATOR_URL, url);
}

export const DEFAULT_AUTHENTICATOR_URL = "https://auth.kokoro.ws";

export async function getAuthenticatorUrl(): Promise<string> {
  return await getKeyValue(
    CONFIG_KEYS.AUTHENTICATOR_URL,
    DEFAULT_AUTHENTICATOR_URL,
  );
}

export async function saveServerUrl(url: string): Promise<void> {
  await saveKeyValue(CONFIG_KEYS.SERVER_URL, url);
}

export const DEFAULT_SERVER_URL = "https://api.kokoro.ws";

export async function getServerUrl(): Promise<string> {
  return await getKeyValue(CONFIG_KEYS.SERVER_URL, DEFAULT_SERVER_URL);
}
