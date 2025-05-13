/* eslint-disable @typescript-eslint/only-throw-error */
import { redirect } from "@sveltejs/kit";

import { getTokenFromRequest } from "@kokoro/auth";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ request }) => {
  const token = getTokenFromRequest(request.headers);

  if (!token) {
    throw redirect(302, "/");
  }

  return {
    token,
  };
};
