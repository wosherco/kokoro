import { z } from "zod";

import { CALENDAR_SOURCES } from "@kokoro/validators/db";

export const CALENDARS_SYNC_QUEUE = "calendars-sync";

export const calendarsSyncSchema = z.object({
  integrationAccountId: z.string(),
  source: z.enum(CALENDAR_SOURCES),
  calendarId: z.string().optional(),
});

export type CalendarsSync = z.infer<typeof calendarsSyncSchema>;
