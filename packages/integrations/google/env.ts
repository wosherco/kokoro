import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as baseEnv } from "@kokoro/envs";
import ngrokEnv from "@kokoro/envs/ngrok";
import urlsEnv from "@kokoro/envs/urls";

export const env = createEnv({
  extends: [ngrokEnv, urlsEnv, baseEnv],
  server: {
    ACCOUNT_GOOGLE_CLIENT_ID: z.string().min(1),
    ACCOUNT_GOOGLE_CLIENT_SECRET: z.string().min(1),
    ACCOUNT_GOOGLE_CALLBACK_URL: z.string().min(1),
    ACCOUNT_PEOPLEAPI_CLIENT_ID: z.string().min(1),
    ACCOUNT_PEOPLEAPI_CLIENT_SECRET: z.string().min(1),
    ACCOUNT_PEOPLEAPI_CALLBACK_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
  skipValidation: process.env.CI !== undefined,
});
