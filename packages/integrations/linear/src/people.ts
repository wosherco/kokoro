import type { IntegrationUserInfo } from "@kokoro/validators/integrations";

import type { LinearAccountDetails } from "./client";
import { resolveLinearPaginatedRequest } from "./utils";

export async function getLinearUserInfo(
  account: LinearAccountDetails,
): Promise<IntegrationUserInfo> {
  const user = await account.client.viewer;

  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

export async function fetchLinearWorkspaceUsers(account: LinearAccountDetails) {
  const users = await resolveLinearPaginatedRequest(account.client.users());

  return users;
}
