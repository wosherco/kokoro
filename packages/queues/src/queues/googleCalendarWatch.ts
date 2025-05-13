import { z } from "zod";

export const GOOGLE_CALENDAR_WATCH_QUEUE = "google-calendar-watch";

export const googleCalendarWatchSchema = z.object({
  userId: z.string().uuid(),
  integrationAccountId: z.string(),
  calendarId: z.string().optional(),
  shouldUnwatch: z.boolean().default(false).optional(),
  rewatch: z.boolean().default(false).optional(),
});

export type GoogleCalendarWatch = z.infer<typeof googleCalendarWatchSchema>;
