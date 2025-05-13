import { getCalendarSource } from "@kokoro/brain/calendar";
import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { calendarTable } from "@kokoro/db/schema";
import type { Consumer } from "@kokoro/queues";
import { CALENDAR_EVENTS_SYNC_QUEUE, consume } from "@kokoro/queues";

import { logger } from "../logger";

export const calendarEventsSync = (): Consumer =>
  consume(
    CALENDAR_EVENTS_SYNC_QUEUE,
    async (message) => {
      const calendarSource = getCalendarSource(message.source);

      const calendars = await db
        .select({ id: calendarTable.id })
        .from(calendarTable)
        .where(eq(calendarTable.id, message.calendarId));

      if (!calendars.length) {
        throw new Error("Calendar not found");
      }

      const calendar = calendars[0];

      if (message.platformEventId) {
        // TODO: Implement

        return;
      }

      await calendarSource.syncEvents(
        message.integrationAccountId,
        calendar.id
      );
    },
    logger
  );
