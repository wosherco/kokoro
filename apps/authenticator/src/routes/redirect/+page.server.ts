/* eslint-disable @typescript-eslint/only-throw-error */
import { getRedirectCookie } from "@/cookies";
import { redirect } from "@sveltejs/kit";

import { getTokenFromRequest } from "@kokoro/auth";

import { env } from "$env/dynamic/public";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ cookies, request, url }) => {
  const redirectTo =
    url.searchParams.get("redirectTo") ?? getRedirectCookie(cookies);

  if (redirectTo === "phone") {
    const token = getTokenFromRequest(request.headers);
    if (token !== null) {
      throw redirect(302, `kokoro://auth/callback?token=${token}`);
    }
  }

  if (redirectTo === "account" && env.PUBLIC_ACCOUNT_URL) {
    throw redirect(302, env.PUBLIC_ACCOUNT_URL);
  }

  if (redirectTo === "webapp" && env.PUBLIC_APP_URL) {
    throw redirect(302, env.PUBLIC_APP_URL);
  }

  if (redirectTo === "mcp") {
    throw redirect(302, "/cli");
  }

  if (redirectTo === "developers" && env.PUBLIC_DEVELOPERS_URL) {
    throw redirect(302, env.PUBLIC_DEVELOPERS_URL);
  }

  if (redirectTo === "oauth") {
    throw redirect(302, "/authorize");
  }

  throw redirect(302, "https://kokoro.ws");
};
