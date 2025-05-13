import { Hono } from "hono";
import { pinoLogger } from "hono-pino";

import { ensureKeys, getPowerSyncPublicKey } from "@kokoro/api/logic";

import { env } from "../env";
import { logger } from "../logger";

const powersync = new Hono().use(
  "*",
  pinoLogger({
    pino: logger.child({
      subrouter: "powersync",
    }),
  }),
);

powersync.get("/keys", async (c) => {
  await ensureKeys({
    privateKey: env.POWERSYNC_PRIVATE_KEY,
    publicKey: env.POWERSYNC_PUBLIC_KEY,
  });

  const publicKey = getPowerSyncPublicKey();

  if (!publicKey) {
    return c.json({ keys: [] }, 404);
  }

  return c.json({ keys: [publicKey] });
});

export { powersync };
