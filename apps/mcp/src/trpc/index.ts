import { createTRPCClient, unstable_httpBatchStreamLink } from "@trpc/client";
import SuperJSON from "superjson";

import type { AppRouter } from "@kokoro/api";

import { getAuthToken, getServerUrl } from "../utils/config";

const serverUrl = await getServerUrl();

export const trpc = createTRPCClient<AppRouter>({
  links: [
    unstable_httpBatchStreamLink({
      url: `${serverUrl}/trpc`,
      transformer: SuperJSON,
      async headers() {
        const token = await getAuthToken();

        if (!token) {
          return {};
        }

        return {
          Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
});
