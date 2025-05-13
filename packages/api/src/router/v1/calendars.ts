import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, eq, not } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { calendarTable } from "@kokoro/db/schema";

import { protectedProcedure } from "../../trpc";

export const v1CalendarsRouter = {
  getCalendar: protectedProcedure
    .input(
      z.object({
        calendarId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [calendar] = await db
        .select({
          id: calendarTable.id,
          integrationAccountId: calendarTable.integrationAccountId,
          platformCalendarId: calendarTable.platformCalendarId,
          platformAccountId: calendarTable.platformAccountId,

          summary: calendarTable.summary,
          summaryOverride: calendarTable.summaryOverride,
          source: calendarTable.source,
          description: calendarTable.description,
          color: calendarTable.color,
          colorOverride: calendarTable.colorOverride,
          timeZone: calendarTable.timeZone,
          platformData: calendarTable.platformData,

          lastSynced: calendarTable.lastSynced,

          createdAt: calendarTable.createdAt,
          updatedAt: calendarTable.lastUpdate,
        })
        .from(calendarTable)
        .where(
          and(
            eq(calendarTable.id, input.calendarId),
            eq(calendarTable.userId, ctx.user.id),
            not(calendarTable.hidden),
          ),
        );

      if (!calendar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Calendar not found",
        });
      }

      return {
        calendar,
        prompt: "TODO",
      };
    }),
} satisfies TRPCRouterRecord;
