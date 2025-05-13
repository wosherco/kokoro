import { PUBLIC_ENVIRONMENT } from "$env/static/public";
import * as Sentry from "@sentry/sveltekit";
import { handleErrorWithSentry } from "@sentry/sveltekit";

Sentry.init({
  dsn: "https://af2ce488089b3c0febaed094f41e18df@o4507313660428288.ingest.de.sentry.io/4508682765467728",
  environment: PUBLIC_ENVIRONMENT,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Optional: Initialize Session Replay:
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

if (PUBLIC_ENVIRONMENT === "development") {
  Sentry.init({});
}

export const handleError = handleErrorWithSentry();
