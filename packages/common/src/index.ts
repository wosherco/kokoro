import type { GoogleCalendarPlatformData } from "@kokoro/validators/db";

import { isNil } from "./poldash";

interface CommonGoogleCalendar {
  platformData: GoogleCalendarPlatformData | null;
}

interface CommonMemory {
  event: {
    recurringEventPlatformId: string | null;
    rrule: string | null;
    isOrganizer: boolean | null;
  } | null;
}

interface CommonAttendee {
  organizer?: boolean | null;
  self?: boolean | null;
}

export function isRecurringEvent(memory: CommonMemory): boolean {
  return !isNil(memory.event?.rrule);
}

export function isRecurringInstanceEvent(memory: CommonMemory): boolean {
  return !isNil(memory.event?.recurringEventPlatformId);
}

export function isSelfOrganizer(attendees: CommonAttendee[]): boolean {
  return attendees.some(
    (attendee) => attendee.organizer === true && attendee.self === true,
  );
}

export function canEditEvent(
  calendar: CommonGoogleCalendar,
  event: CommonMemory,
): boolean {
  return (
    calendar.platformData?.accessRole === "owner" ||
    calendar.platformData?.accessRole === "writer" ||
    event.event?.isOrganizer === true
  );
}

export function isGoogleCalendarHolidays(calendarId: string): boolean {
  const holidayCalendarRegex =
    /^[\w-]+\.[\w-]+#holiday@group\.v\.calendar\.google\.com$/;
  return holidayCalendarRegex.test(calendarId);
}

export function isGoogleCalendarBirthdays(calendarId: string): boolean {
  const birthdayCalendarRegex =
    /^([\w-]+\.[\w-]+#birthday|addressbook#contacts)@group\.v\.calendar\.google\.com$/;
  return birthdayCalendarRegex.test(calendarId);
}
