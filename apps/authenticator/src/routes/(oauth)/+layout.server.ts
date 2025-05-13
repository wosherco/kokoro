import { setRedirectCookie } from "@/cookies";
import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
  setRedirectCookie(cookies, url.searchParams.get("redirectTo"));

  if (locals.auth.session !== null) {
    return redirect(302, "/redirect");
  }

  return {};
};
