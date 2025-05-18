import { TZDateMini } from "@date-fns/tz";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getMemories, queryMemories } from "@kokoro/brain";
import { MEMORY_SORT_BY, ORDER_BY, TASK_STATES } from "@kokoro/validators/db";

import { protectedProcedure } from "../../trpc";

export const v1MemoriesRouter = {
  queryMemories: protectedProcedure
    .input(
      z.object({
        // Filter by content
        contentQuery: z.string().max(100).optional(),
        descriptionQuery: z.string().max(100).optional(),

        // Filter by date
        startDate: z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),
        endDate: z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),

        // Filter by integration
        integrationAccountIds: z.array(z.string().uuid()).optional(),
        calendarIds: z.array(z.string().uuid()).optional(),
        tasklistIds: z.array(z.string().uuid()).optional(),

        // Filter by calendar source
        //calendarSources: z.array(z.enum(CALENDAR_SOURCES)).optional(),

        // Filter by tasks
        //taskSources: z.array(z.enum(TASK_SOURCES)).optional(),
        taskStates: z.array(z.enum(TASK_STATES)).optional(),

        // Sort by
        sortBy: z.enum(MEMORY_SORT_BY).default("similarity").optional(),
        orderBy: z.enum(ORDER_BY).default("desc").optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const memories = await queryMemories(ctx.user.id, {
          contentQuery: input.contentQuery,
          descriptionQuery: input.descriptionQuery,
          startDate: input.startDate
            ? new TZDateMini(input.startDate)
            : undefined,
          endDate: input.endDate ? new TZDateMini(input.endDate) : undefined,
          integrationAccountIds: input.integrationAccountIds,
          calendarIds: input.calendarIds,
          tasklistIds: input.tasklistIds,

          taskStates: input.taskStates ? new Set(input.taskStates) : undefined,
          sortBy: input.sortBy,
          orderBy: input.orderBy,
        });
        return memories;
      } catch (error) {
        console.error("error", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to query memories",
        });
      }
    }),

  getMemories: protectedProcedure
    .input(z.object({ memoryIds: z.array(z.string().uuid()).max(25) }))
    .query(async ({ ctx, input }) => {
      const memories = await getMemories(ctx.user.id, input.memoryIds);

      return memories;
    }),
} satisfies TRPCRouterRecord;
