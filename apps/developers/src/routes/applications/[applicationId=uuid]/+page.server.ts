import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { oauthClientTable } from "@kokoro/db/schema";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const [application] = await db
    .select({
      id: oauthClientTable.id,
      name: oauthClientTable.name,
      clientId: oauthClientTable.clientId,
      clientSecret: oauthClientTable.clientSecret,
      redirectUris: oauthClientTable.redirectUris,
      scopes: oauthClientTable.scopes,
      createdAt: oauthClientTable.createdAt,
      updatedAt: oauthClientTable.updatedAt,
    })
    .from(oauthClientTable)
    .where(
      and(
        eq(oauthClientTable.id, params.applicationId),
        eq(oauthClientTable.ownerId, locals.auth.user.id),
      ),
    );

  if (!application) {
    throw error(404, "Application not found");
  }

  return {
    application,
  };
};
