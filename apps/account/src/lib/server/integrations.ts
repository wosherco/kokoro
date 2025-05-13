import { error } from "@sveltejs/kit";

import { MAX_INTEGRATION_ACCOUNTS } from "@kokoro/consts";
import { eq } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db } from "@kokoro/db/client";
import { integrationsAccountsTable } from "@kokoro/db/schema";

export async function hasReachedMaxIntegrationAccounts(
  userId: string,
  tx?: TransactableDBType,
) {
  const count = await (tx ?? db).$count(
    integrationsAccountsTable,
    eq(integrationsAccountsTable.userId, userId),
  );

  return count >= MAX_INTEGRATION_ACCOUNTS;
}

export async function throwIfReachedMaxIntegrationAccounts(
  userId: string,
  tx?: TransactableDBType,
) {
  if (await hasReachedMaxIntegrationAccounts(userId, tx)) {
    throw error(
      400,
      `Maximum number of integration accounts reached (${MAX_INTEGRATION_ACCOUNTS})`,
    );
  }
}
