import { and, eq, not } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { calendarTable } from "@kokoro/db/schema";

import { ORPCError } from "@orpc/server";
import { os, authorizedMiddleware } from "../../orpc";

export const v1CalendarsRouter = os.v1.calendars.router({
  getCalendar: os.v1.calendars.getCalendar
    .use(authorizedMiddleware)
    .handler(async ({ context, input }) => {
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
            eq(calendarTable.userId, context.user.id),
            not(calendarTable.hidden),
          ),
        );

      if (!calendar) {
        throw new ORPCError("NOT_FOUND");
      }

      return {
        calendar: {
          ...calendar,
          lastSynced: calendar.lastSynced
            ? calendar.lastSynced.toISOString()
            : null,
          createdAt: calendar.createdAt.toISOString(),
          updatedAt: calendar.updatedAt.toISOString(),
        },
        prompt: "TODO",
      };
    }),
});
