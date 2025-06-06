import type { orpcContract } from "@kokoro/validators/contracts";
import type { ContractRouterClient } from "@orpc/contract";
import { getAuthToken, getServerUrl } from "../utils/config";

const serverUrl = await getServerUrl();

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

const link = new RPCLink({
  url: `${serverUrl}/rpc`,
  headers: async () => {
    const token = await getAuthToken();
    return token
      ? { Authorization: `Bearer ${token}`, "x-orpc-source": "mcp" }
      : {};
  },
});

export const orpc: ContractRouterClient<typeof orpcContract> =
  createORPCClient(link);
