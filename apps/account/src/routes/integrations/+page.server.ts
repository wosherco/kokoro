import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { integrationsAccountsTable } from "@kokoro/db/schema";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  const userId = locals.auth.user.id;

  const integrations = db
    .select({
      id: integrationsAccountsTable.id,
      integrationType: integrationsAccountsTable.integrationType,
      platformAccountId: integrationsAccountsTable.platformAccountId,
      email: integrationsAccountsTable.email,
      profilePicture: integrationsAccountsTable.profilePicture,
      platformDisplayName: integrationsAccountsTable.platformDisplayName,
      invalidGrant: integrationsAccountsTable.invalidGrant,
    })
    .from(integrationsAccountsTable)
    .where(eq(integrationsAccountsTable.userId, userId))
    .execute();

  return {
    integrations,
  };
};
