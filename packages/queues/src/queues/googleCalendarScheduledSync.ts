import { z } from "zod";

export const GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE =
  "google-calendar-scheduled-sync";

export const googleCalendarScheduledSyncSchema = z.object({
  bypassTimeLimit: z.boolean().optional(),
  users: z.array(z.string()).optional(),
});

export type GoogleCalendarScheduledSync = z.infer<
  typeof googleCalendarScheduledSyncSchema
>;
