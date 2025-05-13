import * as Sentry from "@sentry/bun";

import { env } from "./env";

Sentry.init({
  dsn: "https://1fffb27c37286ed7f5951894e40c539b@o4507313660428288.ingest.de.sentry.io/4508682941366352",
  environment: env.PUBLIC_ENVIRONMENT,
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
});

if (env.PUBLIC_ENVIRONMENT === "development") {
  Sentry.init({});
}
