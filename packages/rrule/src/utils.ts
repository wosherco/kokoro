import { UTCDateMini } from "@date-fns/utc";
import { DateTime, RRuleSet } from "rrule-rust";

export type RruleDateTime = DateTime;

export function convertToRruleDateTime(date: Date): RruleDateTime {
  const utcDate = new UTCDateMini(date);

  return DateTime.fromObject(
    {
      year: utcDate.getFullYear(),
      month: utcDate.getMonth() + 1,
      day: utcDate.getDate(),
      hour: utcDate.getHours(),
      minute: utcDate.getMinutes(),
      second: utcDate.getSeconds(),
    },
    { utc: true },
  );
}

/**
 * Converts a rrule DateTime to a Date
 * @param date - The date DateTime to convert
 * @param originalDate If provided, offset will be checked for daylight saving time
 * @returns The converted date to JS Date
 */
export function rruleDateTimeToDate(
  date: RruleDateTime,
  originalDate?: Date,
): Date {
  // Create a date in the local timezone
  const localDate = new UTCDateMini(
    date.year,
    date.month - 1,
    date.day,
    date.hour,
    date.minute,
    date.second,
  );

  // If originalDate is provided, handle timezone offset differences
  if (originalDate) {
    // NON AI NOTE FROM @polvallverdu: I don't even know why this works 100% of the time, but it does. Helps handle DST changes.
    const originalOffset = new Date(
      originalDate.getFullYear(),
      originalDate.getMonth(),
      originalDate.getDate(),
    ).getTimezoneOffset();
    const newOffset = new Date(
      date.year,
      date.month - 1,
      date.day,
    ).getTimezoneOffset();

    // If DST changed between original date and new date, adjust for it
    if (originalOffset !== newOffset) {
      // Adjust by the difference in offset (in milliseconds)
      localDate.setMinutes(
        localDate.getMinutes() + (newOffset - originalOffset),
      );
    }
  }

  return localDate;
}

export function dateToRRULEString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function normalizeRruleString(rrule: string): string {
  // Match BYDAY=±n[DAY] pattern, where:
  // ± is optional + (we don't touch negative values)
  // n is 1-53 (valid values per RFC 5545)
  // [DAY] is 2 uppercase letters (MO,TU,WE,TH,FR,SA,SU)
  return rrule.replace(/BYDAY=\+(\d{1,2}[A-Z]{2})/g, "BYDAY=$1");
}

export function parseRrule(
  rrule: string | string[],
  startDate: Date,
): RRuleSet {
  const normalizedRrule = Array.isArray(rrule)
    ? rrule.map(normalizeRruleString)
    : normalizeRruleString(rrule);

  return RRuleSet.parse(
    `DTSTART;TZID=UTC:${dateToRRULEString(new UTCDateMini(startDate))};\n${Array.isArray(normalizedRrule) ? normalizedRrule.join("\n") : normalizedRrule}`,
  );
}
