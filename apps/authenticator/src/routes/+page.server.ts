import { deleteSessionTokenCookie } from "@/server/auth";
import { fail } from "@sveltejs/kit";

import { invalidateSession } from "@kokoro/auth";

import type { Actions } from "./$types";

export const actions: Actions = {
  default: async (event) => {
    if (event.locals.auth.session === null) {
      return fail(401);
    }
    await invalidateSession(event.locals.auth.session.id);
    deleteSessionTokenCookie(event.cookies);
    return null; // Invalidate the current page without redirecting
  },
};
