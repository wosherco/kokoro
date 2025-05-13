import { browser } from "$app/environment";
import posthog from "posthog-js";

import type { LayoutLoad } from "./$types";

export const prerender = true;

export const load: LayoutLoad = () => {
  if (browser) {
    posthog.init("phc_rlCDa4sGdg26NWfLXPW1FFWsJONSBUVjQ7AztkAUIDy", {
      api_host: "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: false,
    });
  }
};
