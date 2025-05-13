import { z } from "zod";

export const GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE =
  "google-calendar-channels-refresh";

export const googleCalendarChannelsRefreshSchema = z.object({});

export type GoogleCalendarChannelsRefresh = z.infer<
  typeof googleCalendarChannelsRefreshSchema
>;
