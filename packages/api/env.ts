import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as dbEnv } from "@kokoro/db/env";

export const env = createEnv({
  extends: [dbEnv],
  server: {
    // POWERSYNC_URL: z.string(),
    // POWERSYNC_PUBLIC_KEY: z.string(),
    // POWERSYNC_PRIVATE_KEY: z.string(),
    // POWERSYNC_AUDIENCE: z.string(),
    DISCORD_WEBHOOK_CONTACT_URL: z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: process.env.CI !== undefined,
});
