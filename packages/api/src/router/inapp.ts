import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, inArray } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { memoryEventTable } from "@kokoro/db/schema";

import { protectedProcedure } from "../trpc";

export const inappRouter = {
  markMemoryConflictResolved: protectedProcedure
    .input(
      z.object({
        memoryIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(memoryEventTable)
        .set({ conflictResolved: true })
        .where(
          and(
            inArray(memoryEventTable.memoryId, input.memoryIds),
            eq(memoryEventTable.userId, ctx.user.id),
          ),
        );
    }),
} satisfies TRPCRouterRecord;
