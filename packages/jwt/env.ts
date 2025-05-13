import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    JWT_SECRET: z.string().min(1),
  },
  runtimeEnv: process.env,
  skipValidation: true,
});
