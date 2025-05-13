import { createEnv } from "@t3-oss/env-core";

import { env as apiEnv } from "@kokoro/api/env";
import ngrokEnv from "@kokoro/envs/ngrok";
import { env as stripeEnv } from "@kokoro/stripe/env";

export const env = createEnv({
  extends: [apiEnv, ngrokEnv, stripeEnv],
  server: {},
  runtimeEnv: process.env,
  skipValidation: process.env.CI !== undefined,
});
