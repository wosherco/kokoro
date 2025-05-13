import { describe, expect, it } from "vitest";

import type { GoogleCalendarEventDate } from "../src/calendar";
import { checkDate } from "../src/utils";

describe("checkDate", () => {
  describe("Full day events", () => {
    it("should handle full day events with date only", () => {
      const input: GoogleCalendarEventDate = {
        date: "2024-03-20",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(true);
      expect(result.date).toBeDefined();
      expect(result.date?.getUTCFullYear()).toBe(2024);
      expect(result.date?.getUTCMonth()).toBe(2); // March is 2 (0-based)
      expect(result.date?.getUTCDate()).toBe(20);
      // Full day events should have time set to midnight UTC
      expect(result.date?.getUTCHours()).toBe(0);
      expect(result.date?.getUTCMinutes()).toBe(0);
      expect(result.date?.getUTCSeconds()).toBe(0);
      expect(result.timeZone).toBeUndefined();
    });

    it("should handle full day events with timezone", () => {
      const input: GoogleCalendarEventDate = {
        date: "2024-03-20",
        timeZone: "America/New_York",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(true);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBe("America/New_York");
      // Full day events should have time set to midnight in the specified timezone
      expect(result.date?.getUTCHours()).toBe(0);
      expect(result.date?.getUTCMinutes()).toBe(0);
      expect(result.date?.getUTCSeconds()).toBe(0);
    });
  });

  describe("Regular events with timezone", () => {
    it("should handle events with timezone and ISO datetime", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00+02:00",
        timeZone: "America/New_York",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBe("America/New_York");
      // 15:30 +02:00 is 13:30 UTC, which is 9:30 in New York
      expect(result.date?.getUTCHours()).toBe(13);
      expect(result.date?.getUTCMinutes()).toBe(30);
    });

    it("should handle events with UTC timezone", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00Z",
        timeZone: "UTC",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBe("UTC");
      expect(result.date?.getUTCHours()).toBe(15);
      expect(result.date?.getUTCMinutes()).toBe(30);
    });

    it("should handle events with different timezone offsets", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00+05:30",
        timeZone: "Asia/Kolkata",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBe("Asia/Kolkata");
      // 15:30 +05:30 is 10:00 UTC, which is 15:30 in Kolkata
      expect(result.date?.getUTCHours()).toBe(10);
      expect(result.date?.getUTCMinutes()).toBe(0);
    });

    it("should handle events with negative timezone offset", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00-08:00",
        timeZone: "America/Los_Angeles",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBe("America/Los_Angeles");
      // 15:30 -08:00 is 23:30 UTC, which is 15:30 in Los Angeles
      expect(result.date?.getUTCHours()).toBe(23);
      expect(result.date?.getUTCMinutes()).toBe(30);
    });
  });

  describe("Regular events without timezone", () => {
    it("should handle events with UTC offset in ISO string", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00+02:00",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBeUndefined();
      // Should preserve the UTC offset from the ISO string
      expect(result.date?.getUTCHours()).toBe(13); // 15:30 +02:00 is 13:30 UTC
      expect(result.date?.getUTCMinutes()).toBe(30);
    });

    it("should handle events with Z timezone in ISO string", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00Z",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBeUndefined();
      expect(result.date?.getUTCHours()).toBe(15);
      expect(result.date?.getUTCMinutes()).toBe(30);
    });

    it("should handle events with milliseconds in ISO string", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00.123Z",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBeUndefined();
      expect(result.date?.getUTCHours()).toBe(15);
      expect(result.date?.getUTCMinutes()).toBe(30);
      expect(result.date?.getUTCMilliseconds()).toBe(123);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined input", () => {
      const result = checkDate(undefined);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeUndefined();
      expect(result.timeZone).toBeUndefined();
    });

    it("should handle empty object input", () => {
      const input: GoogleCalendarEventDate = {};

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeUndefined();
      expect(result.timeZone).toBeUndefined();
    });

    it("should handle events with both date and dateTime (should prioritize dateTime)", () => {
      const input: GoogleCalendarEventDate = {
        date: "2024-03-20",
        dateTime: "2024-03-20T15:30:00Z",
        timeZone: "UTC",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBe("UTC");
      expect(result.date?.getUTCHours()).toBe(15);
      expect(result.date?.getUTCMinutes()).toBe(30);
    });

    it("should handle events with invalid timezone", () => {
      const input: GoogleCalendarEventDate = {
        dateTime: "2024-03-20T15:30:00Z",
        timeZone: "Invalid/Timezone",
      };

      const result = checkDate(input);

      expect(result.isFullDay).toBe(false);
      expect(result.date).toBeDefined();
      expect(result.timeZone).toBe("Invalid/Timezone");
      // Should still parse the date even with invalid timezone
      expect(result.date?.getUTCHours()).toBe(15);
      expect(result.date?.getUTCMinutes()).toBe(30);
    });
  });
});
