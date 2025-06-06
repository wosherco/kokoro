import { env } from "$env/dynamic/public";
import * as Sentry from "@sentry/sveltekit";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { validateSessionRequest } from "@kokoro/auth";

Sentry.init({
  dsn: "https://221a60577f96bdc265c5ace42980bafb@o4507313660428288.ingest.de.sentry.io/4509301081702480",
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

  if (session.session === null) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${env.PUBLIC_AUTHENTICATOR_URL}/?redirectTo=developers`,
      },
    });
  }

  event.locals.accessToApi = session.user.accessToApi;
  event.locals.auth = session;
  event.locals.stripeEnabled =
    env.PUBLIC_STRIPE_ENABLED.toLowerCase() === "true";
  event.locals.subscribed =
    (!event.locals.stripeEnabled ||
      (session.user.subscribedUntil &&
        session.user.subscribedUntil > new Date())) ??
    false;

  const isInNoAccess = event.url.pathname.startsWith("/no-access");
  if (!session.user.accessToApi && !isInNoAccess) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/no-access",
      },
    });
  }

  if (session.user.accessToApi && isInNoAccess) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  if (
    event.url.pathname.startsWith("/subscription") &&
    !event.locals.stripeEnabled
  ) {
    return new Response("Stripe is not enabled", {
      status: 401,
    });
  }

  if (
    event.url.pathname.startsWith("/admin") &&
    session.user.role !== "ADMIN"
  ) {
    return new Response("Not found", {
      status: 404,
    });
  }

  return resolve(event);
};

export const handle = sequence(Sentry.sentryHandle(), handleAuth);
