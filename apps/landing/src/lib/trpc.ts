import { PUBLIC_API_URL } from "$env/static/public";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";

import type { AppRouter } from "@kokoro/api";

// Create the TRPC client
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${PUBLIC_API_URL}/trpc`,
      transformer: SuperJSON,
      fetch: async (url, options) =>
        fetch(url, { ...options, credentials: "include" }),
      headers: () => {
        return {
          "X-TZID": Intl.DateTimeFormat().resolvedOptions().timeZone,
          "x-trpc-source": "app",
        };
      },
    }),
  ],
});
