import crypto from "node:crypto";
import { env } from "$env/dynamic/private";
import { redirect } from "@sveltejs/kit";
import { google } from "googleapis";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ cookies }) => {
  // Generate a random state parameter to prevent CSRF attacks
  const state = crypto.randomUUID();

  // Store the state in a cookie for verification during callback
  cookies.set("google_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 5, // 5 minutes
  });

  const oauth2Client = new google.auth.OAuth2(
    env.ACCOUNT_GOOGLE_CLIENT_ID,
    env.ACCOUNT_GOOGLE_CLIENT_SECRET,
    env.ACCOUNT_GOOGLE_CALLBACK_URL,
  );

  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent",
  });

  throw redirect(302, url);
};
