import * as Sentry from "@sentry/bun";

import { env } from "./env";

Sentry.init({
  dsn: "https://6daffff90bd214f1388e2d21baad178d@o4507313660428288.ingest.de.sentry.io/4508682934943824",
  environment: env.PUBLIC_ENVIRONMENT,
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
});

if (env.PUBLIC_ENVIRONMENT === "development") {
  Sentry.init({});
}
