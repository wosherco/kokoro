import { describe, expect, it } from "vitest";

import {
  applyUntilToRrule,
  convertToRruleDateTime,
  dateToRRULEString,
  getRruleEndDate,
  isDateMatchingRrule,
  parseRrule,
  processRrule,
  rruleDateTimeToDate,
} from "../src";

describe("RRule Utils", () => {
  describe("convertToRruleDateTime", () => {
    it("should convert Date to RruleDateTime correctly", () => {
      const date = new Date("2024-03-15T10:30:00Z");
      const rruleDateTime = convertToRruleDateTime(date);

      expect(rruleDateTime.year).toBe(2024);
      expect(rruleDateTime.month).toBe(3);
      expect(rruleDateTime.day).toBe(15);
      expect(rruleDateTime.hour).toBe(10);
      expect(rruleDateTime.minute).toBe(30);
      expect(rruleDateTime.second).toBe(0);
    });
  });

  describe("rruleDateTimeToDate", () => {
    it("should convert RruleDateTime to Date correctly", () => {
      const date = new Date("2024-03-15T10:30:00Z");
      const rruleDateTime = convertToRruleDateTime(date);
      const convertedBack = rruleDateTimeToDate(rruleDateTime);

      expect(convertedBack.toISOString()).toBe(date.toISOString());
    });
  });

  describe("dateToRRULEString", () => {
    it("should format date to RRULE string format", () => {
      const date = new Date("2024-03-15T10:30:45Z");
      const result = dateToRRULEString(date);
      expect(result).toBe("20240315T103045Z");
    });

    it("should pad single digits with zeros", () => {
      const date = new Date("2024-01-05T09:05:05Z");
      const result = dateToRRULEString(date);
      expect(result).toBe("20240105T090505Z");
    });
  });

  describe("parseRrule", () => {
    it("should parse RRULE string with start date correctly", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";
      const rruleSet = parseRrule(rruleString, startDate);

      expect(rruleSet.toString()).toContain(
        "DTSTART;TZID=UTC:20240315T100000Z",
      );
      expect(rruleSet.toString()).toContain("RRULE:FREQ=DAILY;COUNT=3");
    });

    it("should normalize +nTU to nTU in BYDAY", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const cases = [
        {
          input: "RRULE:FREQ=MONTHLY;BYDAY=+1TU",
          expected: "1TU",
        },
        {
          input: "RRULE:FREQ=MONTHLY;BYDAY=+2TU",
          expected: "2TU",
        },
        {
          input: "RRULE:FREQ=MONTHLY;BYDAY=+5TU", // Testing higher ordinal
          expected: "5TU",
        },
        {
          input: "RRULE:FREQ=MONTHLY;BYDAY=-1TU", // Negative should remain unchanged
          expected: "-1TU",
        },
        {
          input: "RRULE:FREQ=MONTHLY;INTERVAL=1;BYDAY=+1TU;COUNT=5", // Other parts should remain unchanged
          expected: "BYDAY=1TU",
        },
      ];

      for (const { input, expected } of cases) {
        const rruleSet = parseRrule(input, startDate);
        expect(rruleSet.toString()).toContain(expected);
      }
    });

    it("should handle array of RRULE strings with +nTU normalization", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rrules = [
        "RRULE:FREQ=MONTHLY;BYDAY=+1TU",
        "RRULE:FREQ=MONTHLY;BYDAY=+2TU",
      ];
      const rruleSet = parseRrule(rrules, startDate);

      expect(rruleSet.toString()).toContain("BYDAY=1TU");
      expect(rruleSet.toString()).toContain("BYDAY=2TU");
    });
  });

  describe("applyUntilToRrule", () => {
    it("should add UNTIL to RRULE correctly", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const untilDate = new Date("2024-03-20T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY";

      const result = applyUntilToRrule(rruleString, startDate, untilDate);

      expect(result).toContain("UNTIL=20240320T100000Z");
    });
  });

  describe("processRrule", () => {
    it("should generate correct dates within the query range", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const queryStartDate = new Date("2024-03-15T10:00:00Z");
      const queryEndDate = new Date("2024-03-17T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";

      const dates = processRrule(
        rruleString,
        startDate,
        queryStartDate,
        queryEndDate,
        {
          inclusive: true,
          removeStart: false,
        },
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]?.toISOString()).toBe("2024-03-15T10:00:00.000Z");
      expect(dates[1]?.toISOString()).toBe("2024-03-16T10:00:00.000Z");
      expect(dates[2]?.toISOString()).toBe("2024-03-17T10:00:00.000Z");
    });

    it("should generate correct dates within the query range removing start date", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const queryStartDate = new Date("2024-03-15T10:00:00Z");
      const queryEndDate = new Date("2024-03-17T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";

      const dates = processRrule(
        rruleString,
        startDate,
        queryStartDate,
        queryEndDate,
        {
          inclusive: true,
          removeStart: true,
        },
      );

      expect(dates).toHaveLength(2);
      expect(dates[0]?.toISOString()).toBe("2024-03-16T10:00:00.000Z");
      expect(dates[1]?.toISOString()).toBe("2024-03-17T10:00:00.000Z");
    });

    it("should only return dates within query range", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const queryStartDate = new Date("2024-03-16T10:00:00Z"); // Start from second occurrence
      const queryEndDate = new Date("2024-03-17T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";

      const dates = processRrule(
        rruleString,
        startDate,
        queryStartDate,
        queryEndDate,
      );

      expect(dates).toHaveLength(2);
      expect(dates[0]?.toISOString()).toBe("2024-03-16T10:00:00.000Z");
      expect(dates[1]?.toISOString()).toBe("2024-03-17T10:00:00.000Z");
    });
  });

  describe("isDateMatchingRrule", () => {
    it("should return true for a date matching the rule", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const dateToCheck = new Date("2024-03-15T10:00:00Z"); // Exact same time
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";

      const result = isDateMatchingRrule(rruleString, startDate, dateToCheck);
      expect(result).toBe(true);
    });

    it("should return false for a date not matching the rule", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const dateToCheck = new Date("2024-03-18T10:00:00Z"); // After COUNT=3
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";

      const result = isDateMatchingRrule(rruleString, startDate, dateToCheck);
      expect(result).toBe(false);
    });

    it("should handle weekly recurrence correctly", () => {
      const startDate = new Date("2024-03-15T10:00:00Z"); // A Friday
      const rruleString = "RRULE:FREQ=WEEKLY;BYDAY=FR";

      // Check next Friday at same time
      const nextFriday = new Date("2024-03-22T10:00:00Z");
      expect(isDateMatchingRrule(rruleString, startDate, nextFriday)).toBe(
        true,
      );

      // Check a non-Friday at same time
      const nonFriday = new Date("2024-03-20T10:00:00Z"); // A Wednesday
      expect(isDateMatchingRrule(rruleString, startDate, nonFriday)).toBe(
        false,
      );
    });

    it("should return false for matching day but different time", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";

      // Same day, different time
      const sameDayDifferentTime = new Date("2024-03-15T15:30:00Z");
      expect(
        isDateMatchingRrule(rruleString, startDate, sameDayDifferentTime),
      ).toBe(false);
    });

    describe("weekly Tuesday recurrence", () => {
      const startDate = new Date("2024-03-19T10:00:00Z"); // A Tuesday
      const rruleString = "RRULE:FREQ=WEEKLY;BYDAY=TU";

      it("should match the initial Tuesday", () => {
        const initialTuesday = new Date("2024-03-19T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleString, startDate, initialTuesday),
        ).toBe(true);
      });

      it("should match the next Tuesday", () => {
        const nextTuesday = new Date("2024-03-26T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, nextTuesday)).toBe(
          true,
        );
      });

      it("should match a Tuesday several weeks later", () => {
        const futureTuesday = new Date("2024-04-09T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, futureTuesday)).toBe(
          true,
        );
      });

      it("should not match a non-Tuesday", () => {
        const nonTuesday = new Date("2024-03-20T10:00:00Z"); // A Wednesday
        expect(isDateMatchingRrule(rruleString, startDate, nonTuesday)).toBe(
          false,
        );
      });

      it("should not match a Tuesday at different time", () => {
        const tuesdayDifferentTime = new Date("2024-03-19T11:00:00Z");
        expect(
          isDateMatchingRrule(rruleString, startDate, tuesdayDifferentTime),
        ).toBe(false);
      });

      it("should respect count limit", () => {
        const rruleWithCount = "RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=3";
        const fourthTuesday = new Date("2024-04-09T10:00:00Z"); // 4th Tuesday from start
        expect(
          isDateMatchingRrule(rruleWithCount, startDate, fourthTuesday),
        ).toBe(false);
      });

      it("should respect until limit", () => {
        const rruleWithUntil =
          "RRULE:FREQ=WEEKLY;BYDAY=TU;UNTIL=20240402T235959Z";

        // Tuesday before until date
        const validTuesday = new Date("2024-04-02T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleWithUntil, startDate, validTuesday),
        ).toBe(true);

        // Tuesday after until date
        const invalidTuesday = new Date("2024-04-09T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleWithUntil, startDate, invalidTuesday),
        ).toBe(false);
      });
    });

    describe("nth Tuesday of month recurrence", () => {
      const startDate = new Date("2024-03-01T10:00:00Z");

      it("should treat +1TU and 1TU as equivalent", () => {
        const rruleWithPlus = "RRULE:FREQ=MONTHLY;BYDAY=+1TU";
        const rruleWithoutPlus = "RRULE:FREQ=MONTHLY;BYDAY=1TU";

        // Test several months to ensure consistent behavior
        const dates = [
          new Date("2024-03-05T10:00:00Z"), // First Tuesday of March
          new Date("2024-04-02T10:00:00Z"), // First Tuesday of April
          new Date("2024-05-07T10:00:00Z"), // First Tuesday of May
        ];

        for (const date of dates) {
          const withPlus = isDateMatchingRrule(rruleWithPlus, startDate, date);
          const withoutPlus = isDateMatchingRrule(
            rruleWithoutPlus,
            startDate,
            date,
          );
          expect(withPlus).toBe(true);
          expect(withoutPlus).toBe(true);
          expect(withPlus).toBe(withoutPlus);
        }

        // Test that both reject non-first Tuesdays
        const nonFirstTuesday = new Date("2024-03-12T10:00:00Z"); // Second Tuesday of March
        expect(
          isDateMatchingRrule(rruleWithPlus, startDate, nonFirstTuesday),
        ).toBe(false);
        expect(
          isDateMatchingRrule(rruleWithoutPlus, startDate, nonFirstTuesday),
        ).toBe(false);
      });

      it("should match first Tuesday of month (+1TU)", () => {
        const rruleString = "RRULE:FREQ=MONTHLY;BYDAY=+1TU";

        // First Tuesday of March 2024 (March 5th)
        const firstTuesday = new Date("2024-03-05T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, firstTuesday)).toBe(
          true,
        );

        // First Tuesday of April 2024 (April 2nd)
        const nextMonthFirstTuesday = new Date("2024-04-02T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleString, startDate, nextMonthFirstTuesday),
        ).toBe(true);

        // Second Tuesday of March (should not match)
        const secondTuesday = new Date("2024-03-12T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, secondTuesday)).toBe(
          false,
        );
      });

      it("should match last Tuesday of month (-1TU)", () => {
        const rruleString = "RRULE:FREQ=MONTHLY;BYDAY=-1TU";

        // Last Tuesday of March 2024 (March 26th)
        const lastTuesday = new Date("2024-03-26T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, lastTuesday)).toBe(
          true,
        );

        // Last Tuesday of April 2024 (April 30th)
        const nextMonthLastTuesday = new Date("2024-04-30T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleString, startDate, nextMonthLastTuesday),
        ).toBe(true);

        // Second-to-last Tuesday of March (should not match)
        const secondToLastTuesday = new Date("2024-03-19T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleString, startDate, secondToLastTuesday),
        ).toBe(false);
      });

      it("should match second Tuesday of month (+2TU)", () => {
        const rruleString = "RRULE:FREQ=MONTHLY;BYDAY=+2TU";

        // Second Tuesday of March 2024 (March 12th)
        const secondTuesday = new Date("2024-03-12T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, secondTuesday)).toBe(
          true,
        );

        // First Tuesday of March (should not match)
        const firstTuesday = new Date("2024-03-05T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, firstTuesday)).toBe(
          false,
        );
      });

      it("should match second-to-last Tuesday of month (-2TU)", () => {
        const rruleString = "RRULE:FREQ=MONTHLY;BYDAY=-2TU";

        // Second-to-last Tuesday of March 2024 (March 19th)
        const secondToLastTuesday = new Date("2024-03-19T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleString, startDate, secondToLastTuesday),
        ).toBe(true);

        // Last Tuesday of March (should not match)
        const lastTuesday = new Date("2024-03-26T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, lastTuesday)).toBe(
          false,
        );
      });

      it("should respect count with nth Tuesday rule", () => {
        const rruleString = "RRULE:FREQ=MONTHLY;BYDAY=+1TU;COUNT=2";

        // First Tuesday of March 2024 (March 5th) - should match
        const firstMatch = new Date("2024-03-05T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, firstMatch)).toBe(
          true,
        );

        // First Tuesday of April 2024 (April 2nd) - should match
        const secondMatch = new Date("2024-04-02T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, secondMatch)).toBe(
          true,
        );

        // First Tuesday of May 2024 (May 7th) - should not match (exceeds COUNT)
        const thirdOccurrence = new Date("2024-05-07T10:00:00Z");
        expect(
          isDateMatchingRrule(rruleString, startDate, thirdOccurrence),
        ).toBe(false);
      });

      it("should respect until with nth Tuesday rule", () => {
        const rruleString =
          "RRULE:FREQ=MONTHLY;BYDAY=+1TU;UNTIL=20240331T235959Z";

        // First Tuesday of March 2024 (March 5th) - should match
        const withinUntil = new Date("2024-03-05T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, withinUntil)).toBe(
          true,
        );

        // First Tuesday of April 2024 (April 2nd) - should not match
        const afterUntil = new Date("2024-04-02T10:00:00Z");
        expect(isDateMatchingRrule(rruleString, startDate, afterUntil)).toBe(
          false,
        );
      });
    });

    it("should respect UNTIL constraint with exact times", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;UNTIL=20240316T235959Z";

      // Date within UNTIL at start time
      const withinUntil = new Date("2024-03-16T10:00:00Z");
      expect(isDateMatchingRrule(rruleString, startDate, withinUntil)).toBe(
        true,
      );

      // Date after UNTIL at start time
      const afterUntil = new Date("2024-03-17T10:00:00Z");
      expect(isDateMatchingRrule(rruleString, startDate, afterUntil)).toBe(
        false,
      );
    });
  });

  describe("getRruleEndDate", () => {
    it("should return the end date from UNTIL parameter", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;UNTIL=20240320T100000Z";

      const endDate = getRruleEndDate(rruleString, startDate);

      expect(endDate?.toISOString()).toBe("2024-03-20T10:00:00.000Z");
    });

    it("should return the end date from COUNT parameter", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;COUNT=3";

      const endDate = getRruleEndDate(rruleString, startDate);

      // With COUNT=3, the last date will be 2 days after start date
      expect(endDate?.toISOString()).toBe("2024-03-17T10:00:00.000Z");
    });

    it("should return the later date when both UNTIL and COUNT are present", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;UNTIL=20240318T100000Z;COUNT=5";

      const endDate = getRruleEndDate(rruleString, startDate);

      // With COUNT=5, the last date will be 4 days after start date (2024-03-19)
      // But UNTIL is set to 2024-03-18, so that should be the end date
      expect(endDate?.toISOString()).toBe("2024-03-18T10:00:00.000Z");
    });

    it("should return the later date when UNTIL is after COUNT end date", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY;UNTIL=20240325T100000Z;COUNT=3";

      const endDate = getRruleEndDate(rruleString, startDate);

      // With COUNT=3, the last date will be 2 days after start date (2024-03-17)
      // But UNTIL is set to 2024-03-25, so that should be the end date
      expect(endDate?.toISOString()).toBe("2024-03-25T10:00:00.000Z");
    });

    it("should handle multiple RRULEs and return the latest end date", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = [
        "RRULE:FREQ=DAILY;UNTIL=20240320T100000Z",
        "RRULE:FREQ=WEEKLY;BYDAY=FR;UNTIL=20240325T100000Z",
      ].join("\n");

      const endDate = getRruleEndDate(rruleString, startDate);

      // The second RRULE has a later UNTIL date
      expect(endDate?.toISOString()).toBe("2024-03-25T10:00:00.000Z");
    });

    it("should handle multiple RRULEs with different COUNT values", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = [
        "RRULE:FREQ=DAILY;COUNT=3",
        "RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=5",
      ].join("\n");

      const endDate = getRruleEndDate(rruleString, startDate);

      // The second RRULE with COUNT=5 will have a later end date
      // 5 weeks after start date (2024-03-15 is a Friday)
      expect(endDate?.toISOString()).toBe("2024-04-12T10:00:00.000Z");
    });

    it("should return null when no end date can be determined", () => {
      const startDate = new Date("2024-03-15T10:00:00Z");
      const rruleString = "RRULE:FREQ=DAILY";

      const endDate = getRruleEndDate(rruleString, startDate);

      expect(endDate).toBeNull();
    });
  });
});
