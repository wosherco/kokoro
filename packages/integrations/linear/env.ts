import { createEnv } from "@t3-oss/env-core";

import { env as baseEnv } from "@kokoro/envs";

export const env = createEnv({
  extends: [baseEnv],
  server: {},
  runtimeEnv: process.env,
  skipValidation: process.env.CI !== undefined,
});
