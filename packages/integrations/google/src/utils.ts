import { tz } from "@date-fns/tz";
import { parseISO } from "date-fns";

import type { GoogleCalendarEventDate } from "./calendar";

export function checkDate(date: GoogleCalendarEventDate | undefined): {
  date?: Date;
  isFullDay: boolean;
  timeZone?: string;
} {
  if (!date) {
    return {
      date: undefined,
      isFullDay: false,
      timeZone: undefined,
    };
  }

  let isFullDay = false;
  let actualDate: Date | undefined;

  if (date.dateTime) {
    // Regular events
    if (date.timeZone) {
      // Convert to UTC while respecting the specified timezone
      actualDate = tz(date.timeZone)(date.dateTime);
    }

    if (!actualDate || Number.isNaN(actualDate.getUTCHours())) {
      // If no timezone specified, parse the ISO string (which includes TZ info)
      actualDate = parseISO(date.dateTime);
    }
  } else if (date.date) {
    // Full-day events
    actualDate = parseISO(date.date);

    isFullDay = true;
  }

  return {
    date: actualDate,
    isFullDay,
    timeZone: date.timeZone ?? undefined,
  } as const;
}
