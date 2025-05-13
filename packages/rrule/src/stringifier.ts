import type { RRule } from "rrule-rust";
import { Frequency, Month, Weekday } from "rrule-rust";

import { parseRrule, rruleDateTimeToDate } from "./utils";

export function getRelevantRrule(
  rrule: string | string[],
  startDate: Date,
): RRule | undefined {
  const rruleSet = parseRrule(rrule, startDate);

  // For now we will only support the first rrule
  const [rruleToStringify] = rruleSet.rrules;

  if (!rruleToStringify) {
    return undefined;
  }

  return rruleToStringify;
}

export function rruleToHumanReadableString(
  rruleToStringify?: RRule,
): string | undefined {
  if (!rruleToStringify) {
    return undefined;
  }

  const parts: string[] = [];

  // Handle frequency and interval
  const freqMap: Record<Frequency, string> = {
    [Frequency.Yearly]: "year",
    [Frequency.Monthly]: "month",
    [Frequency.Weekly]: "week",
    [Frequency.Daily]: "day",
    [Frequency.Hourly]: "hour",
    [Frequency.Minutely]: "minute",
    [Frequency.Secondly]: "second",
  };

  const freq = freqMap[rruleToStringify.frequency];
  parts.push(
    `Every${
      rruleToStringify.interval && rruleToStringify.interval > 1
        ? ` ${rruleToStringify.interval}`
        : ""
    } ${freq}${
      rruleToStringify.interval && rruleToStringify.interval > 1 ? "s" : ""
    }`,
  );

  // Handle weekdays
  if (rruleToStringify.byWeekday.length > 0) {
    const weekdayMap: Record<Weekday, string> = {
      [Weekday.Monday]: "Monday",
      [Weekday.Tuesday]: "Tuesday",
      [Weekday.Wednesday]: "Wednesday",
      [Weekday.Thursday]: "Thursday",
      [Weekday.Friday]: "Friday",
      [Weekday.Saturday]: "Saturday",
      [Weekday.Sunday]: "Sunday",
    };

    const weekdays = rruleToStringify.byWeekday
      .map((day) => {
        // If it's an NWeekday object, it will have a weekday property
        const weekdayValue = typeof day === "object" ? day.weekday : day;
        return weekdayMap[weekdayValue];
      })
      .join(", ");
    parts.push(`on ${weekdays}`);
  }

  // Handle months
  if (rruleToStringify.byMonth.length > 0) {
    const monthMap: Record<Month, string> = {
      [Month.January]: "January",
      [Month.February]: "February",
      [Month.March]: "March",
      [Month.April]: "April",
      [Month.May]: "May",
      [Month.June]: "June",
      [Month.July]: "July",
      [Month.August]: "August",
      [Month.September]: "September",
      [Month.October]: "October",
      [Month.November]: "November",
      [Month.December]: "December",
    };

    const months = rruleToStringify.byMonth
      .map((month) => monthMap[month])
      .join(", ");
    parts.push(`in ${months}`);
  }

  // Handle monthdays
  if (rruleToStringify.byMonthday.length > 0) {
    const days = rruleToStringify.byMonthday.join(", ");
    parts.push(
      `on day${rruleToStringify.byMonthday.length > 1 ? "s" : ""} ${days}`,
    );
  }

  // Handle count or until
  if (rruleToStringify.count) {
    parts.push(`for ${rruleToStringify.count} occurrences`);
  } else if (rruleToStringify.until) {
    const until = rruleDateTimeToDate(rruleToStringify.until);
    parts.push(`until ${until.toLocaleDateString()}`);
  }

  return parts.join(" ");
}

export function rruleToString(rrule: RRule) {
  return rrule.toString();
}
