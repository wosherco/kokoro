import * as Sentry from "@sentry/bun";

import { env } from "./env";

Sentry.init({
  dsn: "https://1fffb27c37286ed7f5951894e40c539b@o4507313660428288.ingest.de.sentry.io/4508682941366352",
  environment: env.PUBLIC_ENVIRONMENT,
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  _experiments: { enableLogs: true },
  integrations: [
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({
      levels: ["log", "error", "warn", "info"],
    }),
  ],
});

if (env.PUBLIC_ENVIRONMENT === "development") {
  Sentry.init({});
}
