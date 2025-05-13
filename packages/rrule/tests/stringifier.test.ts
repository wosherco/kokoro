import { describe, expect, it } from "vitest";

import {
  getRelevantRrule,
  rruleToHumanReadableString,
} from "../src/stringifier";

describe("stringifyRrule", () => {
  const baseDate = new Date("2024-01-01T10:00:00.000Z");

  it("should handle simple daily recurrence", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule("RRULE:FREQ=DAILY", baseDate),
    );
    expect(result).toBe("Every day");
  });

  it("should handle daily recurrence with interval", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule("RRULE:FREQ=DAILY;INTERVAL=2", baseDate),
    );
    expect(result).toBe("Every 2 days");
  });

  it("should handle weekly recurrence with specific days", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR", baseDate),
    );
    expect(result).toBe("Every week on Monday, Wednesday, Friday");
  });

  it("should handle monthly recurrence with specific days", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule("RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15", baseDate),
    );
    expect(result).toBe("Every month on days 1, 15");
  });

  it("should handle yearly recurrence with specific months", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule("RRULE:FREQ=YEARLY;BYMONTH=1,6,12", baseDate),
    );
    expect(result).toBe("Every year in January, June, December");
  });

  it("should handle recurrence with count", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule("RRULE:FREQ=WEEKLY;COUNT=10", baseDate),
    );
    expect(result).toBe("Every week for 10 occurrences");
  });

  it("should handle recurrence with until date", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule("RRULE:FREQ=DAILY;UNTIL=20241231T235959Z", baseDate),
    );
    // Note: The exact format might vary based on locale, you might need to adjust this
    expect(result).toMatch(/Every day until .+/);
  });

  it("should handle complex recurrence pattern", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule(
        "RRULE:FREQ=MONTHLY;INTERVAL=2;BYDAY=MO,TU;BYMONTHDAY=1,15;COUNT=5",
        baseDate,
      ),
    );
    expect(result).toBe(
      "Every 2 months on Monday, Tuesday on days 1, 15 for 5 occurrences",
    );
  });

  it("should return undefined for empty rrule", () => {
    const result = rruleToHumanReadableString(getRelevantRrule("", baseDate));
    expect(result).toBeUndefined();
  });

  it("should handle array of rrules (taking first one)", () => {
    const result = rruleToHumanReadableString(
      getRelevantRrule(
        ["RRULE:FREQ=DAILY;COUNT=5", "RRULE:FREQ=WEEKLY;BYDAY=MO"],
        baseDate,
      ),
    );
    expect(result).toBe("Every day for 5 occurrences");
  });
});
