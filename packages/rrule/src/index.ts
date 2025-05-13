import {
  convertToRruleDateTime,
  parseRrule,
  rruleDateTimeToDate,
} from "./utils";

export * from "./utils";
export * from "./stringifier";

export function applyUntilToRrule(
  rrule: string,
  startDate: Date,
  until: Date,
  removeDtstart = true,
): string {
  const parsedRrule = parseRrule(rrule, startDate);

  const stringified = parsedRrule
    .setRrules(
      parsedRrule.rrules.map((rrule) =>
        rrule.setUntil(convertToRruleDateTime(until)),
      ),
    )
    .toString();

  if (!removeDtstart) {
    return stringified;
  }

  const lines = stringified.split("\n");

  // First line is "DTSTART;TZID=UTC:20250218T040000Z", we need to remove that
  lines.shift();

  return lines.join("\n");
}

export function processRrule(
  rrule: string,
  startDate: Date,
  queryStartDate: Date,
  queryEndDate: Date,
  options: {
    inclusive?: boolean;
    removeStart?: boolean;
  } = {
    inclusive: true,
    removeStart: true,
  },
) {
  const rruleset = parseRrule(rrule, startDate);
  const queryStartDateTime = convertToRruleDateTime(queryStartDate);
  const queryEndDateTime = convertToRruleDateTime(queryEndDate);

  const dates = rruleset.between(
    queryStartDateTime,
    queryEndDateTime,
    options.inclusive,
  );

  return dates
    .map((d) => rruleDateTimeToDate(d, startDate))
    .filter(
      (date) => !options.removeStart || date.getTime() !== startDate.getTime(),
    );
}

export function isDateMatchingRrule(
  rrule: string,
  startDate: Date,
  dateToCheck: Date,
): boolean {
  // Process rrule for just the day we want to check
  const matches = processRrule(rrule, startDate, dateToCheck, dateToCheck, {
    inclusive: true,
    removeStart: false,
  });

  return matches.length > 0;
}

export function getRruleEndDate(rrule: string, startDate: Date) {
  const rruleset = parseRrule(rrule, startDate);

  const lastDateUntil = rruleset.rrules.reduce(
    (acc, rrule) => {
      const until = rrule.until;
      if (!until) {
        return acc;
      }

      const untilDate = rruleDateTimeToDate(until, startDate);
      return !acc || untilDate > acc ? untilDate : acc;
    },
    null as Date | null,
  );

  const lastDateCount = rruleset.rrules.reduce(
    (acc, rrule) => {
      const count = rrule.count;
      if (!count) {
        return acc;
      }

      const parsedRrule = parseRrule(rrule.toString(), startDate);
      const lastDate = parsedRrule.all(count).pop();

      if (!lastDate) {
        return acc;
      }

      const lastDateDate = rruleDateTimeToDate(lastDate, startDate);

      return !acc || lastDateDate > acc ? lastDateDate : acc;
    },
    null as Date | null,
  );

  if (lastDateUntil && lastDateCount) {
    return lastDateUntil > lastDateCount ? lastDateUntil : lastDateCount;
  }

  return lastDateUntil ?? lastDateCount;
}
