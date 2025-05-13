import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, eq, not } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { tasklistsTable } from "@kokoro/db/schema";

import { protectedProcedure } from "../../trpc";

export const v1TasklistsRouter = {
  getTasklist: protectedProcedure
    .input(
      z.object({
        tasklistId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [tasklist] = await db
        .select({
          id: tasklistsTable.id,
          integrationAccountId: tasklistsTable.integrationAccountId,
          platformAccountId: tasklistsTable.platformAccountId,
          platformTaskListId: tasklistsTable.platformTaskListId,
          source: tasklistsTable.source,

          name: tasklistsTable.name,
          config: tasklistsTable.config,

          color: tasklistsTable.color,
          colorOverride: tasklistsTable.colorOverride,

          createdAt: tasklistsTable.createdAt,
          updatedAt: tasklistsTable.updatedAt,
          lastSynced: tasklistsTable.lastSynced,
        })
        .from(tasklistsTable)
        .where(
          and(
            eq(tasklistsTable.id, input.tasklistId),
            eq(tasklistsTable.userId, ctx.user.id),
            not(tasklistsTable.hidden),
          ),
        );

      if (!tasklist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tasklist not found",
        });
      }

      return {
        tasklist,
        prompt: "TODO",
      };
    }),
} satisfies TRPCRouterRecord;
