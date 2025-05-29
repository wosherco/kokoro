import { env } from "$env/dynamic/public";
import * as Sentry from "@sentry/sveltekit";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { validateSessionRequest } from "@kokoro/auth";

Sentry.init({
  dsn: "https://bccea5fa3aeb1456d728e0bf77b235ff@o4507313660428288.ingest.de.sentry.io/4508682739581008",
  environment: env.PUBLIC_ENVIRONMENT,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
  _experiments: { enableLogs: true },
  integrations: [
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
});

if (env.PUBLIC_ENVIRONMENT === "development") {
  Sentry.init({});
}

const handleAuth: Handle = async ({ event, resolve }) => {
  const session = await validateSessionRequest(event.request.headers);
  event.locals.auth = session;

  return resolve(event);
};

export const handle = sequence(Sentry.sentryHandle(), handleAuth);
