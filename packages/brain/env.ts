import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    EMBEDDING_SERVICE_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
  skipValidation: process.env.CI !== undefined,
});
