import { env } from "$env/dynamic/public";
import * as Sentry from "@sentry/sveltekit";
import { handleErrorWithSentry } from "@sentry/sveltekit";

Sentry.init({
  dsn: "https://221a60577f96bdc265c5ace42980bafb@o4507313660428288.ingest.de.sentry.io/4509301081702480",
  environment: env.PUBLIC_ENVIRONMENT,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Optional: Initialize Session Replay:
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

if (env.PUBLIC_ENVIRONMENT === "development") {
  Sentry.init({});
}

export const handleError = handleErrorWithSentry();
