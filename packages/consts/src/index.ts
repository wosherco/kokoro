export const MAX_INTEGRATION_ACCOUNTS = 5;

export const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.PUBLIC_ENVIRONMENT === "development";

const DEV_STRIPE_PRICE_ID = "price_1ROMqMIAZ4qvnsLQx0ZS9Du5";
const PROD_STRIPE_PRICE_ID = "price_1ROMpuIAZ4qvnsLQeQ9pUxFk";

export const STRIPE_PRICE_ID = isDev
  ? DEV_STRIPE_PRICE_ID
  : PROD_STRIPE_PRICE_ID;

const DEV_SITE_URLS = {
  landing: "http://localhost:3002",
  authenticator: "http://localhost:5173",
  account: "http://localhost:5174",
  app: "http://localhost:5175",
  server: "http://localhost:3001",
};

const PROD_SITE_URLS = {
  landing: "https://kokoro.ws",
  authenticator: "https://auth.kokoro.ws",
  account: "https://account.kokoro.ws",
  app: "https://app.kokoro.ws",
  server: "https://api.kokoro.ws",
};

export const SITE_URLS = isDev ? DEV_SITE_URLS : PROD_SITE_URLS;

export const TUNNELED_SERVER_URL =
  process.env.NGROK_ENABLED && process.env.NGROK_URL
    ? `https://${process.env.NGROK_URL}`
    : SITE_URLS.server;
