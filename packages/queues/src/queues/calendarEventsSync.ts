import { z } from "zod";

import { CALENDAR_SOURCES } from "@kokoro/validators/db";

export const CALENDAR_EVENTS_SYNC_QUEUE = "calendar-events-sync";

export const calendarEventsSyncSchema = z.object({
  integrationAccountId: z.string(),
  source: z.enum(CALENDAR_SOURCES),
  calendarId: z.string(),
  platformEventId: z.string().optional(),
});

export type CalendarEventsSync = z.infer<typeof calendarEventsSyncSchema>;
