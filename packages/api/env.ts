import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as dbEnv } from "@kokoro/db/env";

export const env = createEnv({
  extends: [dbEnv],
  server: {
    DISCORD_WEBHOOK_CONTACT_URL: z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: process.env.CI !== undefined,
});
