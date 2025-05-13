import { env } from "$env/dynamic/public";
import * as Sentry from "@sentry/sveltekit";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { validateSessionRequest } from "@kokoro/auth";

Sentry.init({
  dsn: "https://0d8bf9329ea72db31a0eef4a66606beb@o4507313660428288.ingest.de.sentry.io/4508682704846928",
  environment: env.PUBLIC_ENVIRONMENT,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
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
        Location: `${env.PUBLIC_AUTHENTICATOR_URL}/?redirectTo=account`,
      },
    });
  }

  event.locals.auth = session;
  event.locals.stripeEnabled =
    env.PUBLIC_STRIPE_ENABLED.toLowerCase() === "true";
  event.locals.subscribed =
    (!event.locals.stripeEnabled ||
      (session.user.subscribedUntil &&
        session.user.subscribedUntil > new Date())) ??
    false;

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
