import { createEnv } from "@t3-oss/env-core";

import { env as dbEnv } from "@kokoro/db/env";
import { env as queuesEnv } from "@kokoro/queues/env";
import { env as stripeEnv } from "@kokoro/stripe/env";

export const env = createEnv({
  extends: [dbEnv, queuesEnv, stripeEnv],
  server: {},
  runtimeEnv: process.env,
  skipValidation: process.env.CI !== undefined,
});
