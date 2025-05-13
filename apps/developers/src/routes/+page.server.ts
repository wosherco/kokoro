import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { oauthClientTable } from "@kokoro/db/schema";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (!locals.auth.user.accessToApi) {
    throw error(403, "You do not have access to this resource");
  }

  const applications = db
    .select({
      id: oauthClientTable.id,
      name: oauthClientTable.name,
      createdAt: oauthClientTable.createdAt,
      updatedAt: oauthClientTable.updatedAt,
    })
    .from(oauthClientTable)
    .where(eq(oauthClientTable.ownerId, locals.auth.user.id))
    .execute();

  return {
    applications,
  };
};
