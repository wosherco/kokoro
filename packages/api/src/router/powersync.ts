import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "../../env";
import { ensureKeys, generatePowerSyncToken } from "../logic/powersync";
import { protectedProcedure } from "../trpc";

export const powersyncRouter = {
  getPowersyncToken: protectedProcedure
    .output(
      z.object({
        token: z.string(),
        powersyncUrl: z.string(),
        userId: z.string(),
        expiresAt: z.string().describe("ISO 8601"),
      }),
    )
    .query(async ({ ctx }) => {
      try {
        await ensureKeys({
          privateKey: env.POWERSYNC_PRIVATE_KEY,
          publicKey: env.POWERSYNC_PUBLIC_KEY,
        });

        return generatePowerSyncToken(ctx.user.id, {
          audience: env.POWERSYNC_AUDIENCE,
          url: env.POWERSYNC_URL,
        });
      } catch (e) {
        console.error(e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate PowerSync token",
        });
      }
    }),
} satisfies TRPCRouterRecord;
