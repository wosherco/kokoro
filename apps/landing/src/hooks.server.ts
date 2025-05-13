import { PUBLIC_ENVIRONMENT } from "$env/static/public";
import { i18n } from "$lib/i18n";
import * as Sentry from "@sentry/sveltekit";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

Sentry.init({
  dsn: "https://af2ce488089b3c0febaed094f41e18df@o4507313660428288.ingest.de.sentry.io/4508682765467728",
  environment: PUBLIC_ENVIRONMENT,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

if (PUBLIC_ENVIRONMENT === "development") {
  Sentry.init({});
}

const handleParaglide: Handle = i18n.handle();

export const handle = sequence(Sentry.sentryHandle(), handleParaglide);
