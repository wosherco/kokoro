import { env } from "$env/dynamic/public";
import type { orpcContract } from "@kokoro/validators/contracts";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";

const link = new RPCLink({
  url: `${env.PUBLIC_API_URL}/rpc`,
  fetch: async (url, options) =>
    fetch(url, { ...options, credentials: "include" }),
  headers: () => {
    return {
      "X-TZID": Intl.DateTimeFormat().resolvedOptions().timeZone,
      "x-orpc-source": "developers",
    };
  },
});

export const orpc: ContractRouterClient<typeof orpcContract> =
  createORPCClient(link);
