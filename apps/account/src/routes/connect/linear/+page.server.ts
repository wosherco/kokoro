import crypto from "node:crypto";
import { env } from "$env/dynamic/private";
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ cookies }) => {
  // Generate a random state parameter to prevent CSRF attacks
  const state = crypto.randomUUID();

  // Store the state in a cookie for verification during callback
  cookies.set("linear_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 5, // 5 minutes
  });

  const scopes = ["read", "write", "issues:create", "comments:create"];

  const authUrl = new URL("https://linear.app/oauth/authorize");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", env.ACCOUNT_LINEAR_CLIENT_ID);
  authUrl.searchParams.append("redirect_uri", env.ACCOUNT_LINEAR_CALLBACK_URL);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("scope", scopes.join(","));
  authUrl.searchParams.append("prompt", "consent");

  throw redirect(302, authUrl.toString());
};
