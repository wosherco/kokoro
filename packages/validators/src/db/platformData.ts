import type { GoogleCalendarEventAccessRole } from "./old";

export const GOOGLE_CALENDAR_EVENT_STATUS = [
  "confirmed",
  "tentative",
  "cancelled",
] as const;

export type GoogleCalendarEventStatus =
  (typeof GOOGLE_CALENDAR_EVENT_STATUS)[number];

export const GOOGLE_CALENDAR_EVENT_TRANSPARENCY = [
  "opaque",
  "transparent",
] as const;

export type GoogleCalendarEventTransparency =
  (typeof GOOGLE_CALENDAR_EVENT_TRANSPARENCY)[number];

export const GOOGLE_CALENDAR_EVENT_VISIBILITY = [
  "default",
  "public",
  "private",
  /**
   * This value is provided for compatibility reasons. This is private too.
   */
  "confidential",
] as const;

export type GoogleCalendarEventVisibility =
  (typeof GOOGLE_CALENDAR_EVENT_VISIBILITY)[number];

export interface GoogleCalendarEventPlatformData {
  transparency: GoogleCalendarEventTransparency;
  visibility: GoogleCalendarEventVisibility;
  summary: string;
  description?: string;
  location?: string;
}

export interface GoogleCalendarPlatformData {
  primary: boolean;
  accessRole: GoogleCalendarEventAccessRole;
}

export type IntegrationPlatformData =
  | GoogleCalendarIntegrationPlatformData
  | LinearIntegrationPlatformData;

export interface GoogleCalendarIntegrationPlatformData {
  syncToken: string;
  /**
   * ISO string
   */
  lastSynced: string;
}

export interface LinearIntegrationPlatformData {
  workspaceId: string;
}
