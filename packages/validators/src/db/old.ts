export const GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS = [
  "needsAction",
  "declined",
  "tentative",
  "accepted",
] as const;

export type GoogleCalendarEventAttendantStatus =
  (typeof GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS)[number];

export const GOOGLE_CALENDAR_EVENT_TYPES = [
  "default",
  "focusTime",
  "outOfOffice",
  "workingLocation",
] as const;

export type GoogleCalendarEventType =
  (typeof GOOGLE_CALENDAR_EVENT_TYPES)[number];

/**
 * - "freeBusyReader" - Provides read access to free/busy information.
 * - "reader" - Provides read access to the calendar. Private events will appear to users with reader access, but event details will be hidden.
 * - "writer" - Provides read and write access to the calendar. Private events will appear to users with writer access, and event details will be visible.
 * - "owner" - Provides ownership of the calendar. This role has all of the permissions of the writer role with the additional ability to see and manipulate ACLs.
 */
export const GOOGLE_CALENDAR_EVENT_ACCESS_ROLES = [
  "freeBusyReader",
  "reader",
  "writer",
  "owner",
] as const;

export type GoogleCalendarEventAccessRole =
  (typeof GOOGLE_CALENDAR_EVENT_ACCESS_ROLES)[number];

// For google contacts

export const GOOGLE_CONTACT_ENDPOINT = [
  "connections",
  "directory",
  "otherContacts",
] as const;

export type GoogleContactType = (typeof GOOGLE_CONTACT_ENDPOINT)[number];

export const GOOGLE_EMAIL_TYPE = ["home", "work", "other"] as const;

export type GoogleEmailType = (typeof GOOGLE_EMAIL_TYPE)[number];
