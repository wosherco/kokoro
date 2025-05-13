import { describe, expect, it } from "vitest";

import {
  canEditEvent,
  isGoogleCalendarBirthdays,
  isGoogleCalendarHolidays,
  isRecurringEvent,
  isRecurringInstanceEvent,
  isSelfOrganizer,
} from "../src";

describe("isRecurringEvent", () => {
  it("should return true when event has rrule", () => {
    const memory = {
      event: {
        recurringEventPlatformId: null,
        rrule: "RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=MO,WE,FR",
        isOrganizer: true,
      },
    };
    expect(isRecurringEvent(memory)).toBe(true);
  });

  it("should return false when event has no rrule", () => {
    const memory = {
      event: {
        recurringEventPlatformId: null,
        rrule: null,
        isOrganizer: true,
      },
    };
    expect(isRecurringEvent(memory)).toBe(false);
  });

  it("should return false when event is null", () => {
    const memory = { event: null };
    expect(isRecurringEvent(memory)).toBe(false);
  });
});

describe("isRecurringInstanceEvent", () => {
  it("should return true when event has recurringEventId", () => {
    const memory = {
      event: {
        recurringEventPlatformId: "abc123",
        rrule: null,
        isOrganizer: true,
      },
    };
    expect(isRecurringInstanceEvent(memory)).toBe(true);
  });

  it("should return false when event has no recurringEventId", () => {
    const memory = {
      event: {
        recurringEventPlatformId: null,
        rrule: null,
        isOrganizer: true,
      },
    };
    expect(isRecurringInstanceEvent(memory)).toBe(false);
  });

  it("should return false when event is null", () => {
    const memory = { event: null };
    expect(isRecurringInstanceEvent(memory)).toBe(false);
  });
});

describe("isSelfOrganizer", () => {
  it("should return true when attendee is organizer and self", () => {
    const attendees = [
      { organizer: true, self: true },
      { organizer: false, self: false },
    ];
    expect(isSelfOrganizer(attendees)).toBe(true);
  });

  it("should return false when no attendee is both organizer and self", () => {
    const attendees = [
      { organizer: true, self: false },
      { organizer: false, self: true },
    ];
    expect(isSelfOrganizer(attendees)).toBe(false);
  });

  it("should return false with empty attendees array", () => {
    expect(isSelfOrganizer([])).toBe(false);
  });
});

describe("canEditEvent", () => {
  it("should return true when calendar accessRole is owner", () => {
    const calendar = {
      platformData: { accessRole: "owner" as const, primary: true },
    };
    const event = {
      event: {
        isOrganizer: false,
        recurringEventPlatformId: null,
        rrule: null,
      },
    };
    expect(canEditEvent(calendar, event)).toBe(true);
  });

  it("should return true when calendar accessRole is writer", () => {
    const calendar = {
      platformData: { accessRole: "writer" as const, primary: true },
    };
    const event = {
      event: {
        isOrganizer: false,
        recurringEventPlatformId: null,
        rrule: null,
      },
    };
    expect(canEditEvent(calendar, event)).toBe(true);
  });

  it("should return true when event isOrganizer is true", () => {
    const calendar = {
      platformData: { accessRole: "reader" as const, primary: true },
    };
    const event = {
      event: { isOrganizer: true, recurringEventPlatformId: null, rrule: null },
    };
    expect(canEditEvent(calendar, event)).toBe(true);
  });

  it("should return false when none of the conditions are met", () => {
    const calendar = {
      platformData: { accessRole: "reader" as const, primary: true },
    };
    const event = {
      event: {
        isOrganizer: false,
        recurringEventPlatformId: null,
        rrule: null,
      },
    };
    expect(canEditEvent(calendar, event)).toBe(false);
  });
});

describe("isGoogleCalendarHolidays", () => {
  it("should return true for valid holiday calendar IDs", () => {
    expect(
      isGoogleCalendarHolidays(
        "en-gb.spain#holiday@group.v.calendar.google.com",
      ),
    ).toBe(true);
    expect(
      isGoogleCalendarHolidays("en.spain#holiday@group.v.calendar.google.com"),
    ).toBe(true);
  });

  it("should return false for non-holiday calendar IDs", () => {
    expect(
      isGoogleCalendarHolidays(
        "jfghjfghjfghjfghjfgh@group.calendar.google.com",
      ),
    ).toBe(false);
    expect(
      isGoogleCalendarHolidays(
        "addressbook#contacts@group.v.calendar.google.com",
      ),
    ).toBe(false);
    expect(
      isGoogleCalendarHolidays("jyftjftyjtyfj@group.calendar.google.com"),
    ).toBe(false);
    expect(
      isGoogleCalendarHolidays("jfhgjfghjfghjfgh@import.calendar.google.com"),
    ).toBe(false);
    expect(
      isGoogleCalendarHolidays("uujhgjfghjfghjfgh@group.calendar.google.com"),
    ).toBe(false);
  });
});

describe("isGoogleCalendarBirthdays", () => {
  it("should return true for valid birthday calendar IDs", () => {
    expect(
      isGoogleCalendarBirthdays(
        "addressbook#contacts@group.v.calendar.google.com",
      ),
    ).toBe(true);
    expect(
      isGoogleCalendarBirthdays("en.usa#birthday@group.v.calendar.google.com"),
    ).toBe(true);
  });

  it("should return false for non-birthday calendar IDs", () => {
    expect(
      isGoogleCalendarBirthdays(
        "gsdfgsdfgdfsgsdfgsdfgsdf@group.calendar.google.com",
      ),
    ).toBe(false);
    expect(
      isGoogleCalendarBirthdays("en.spain#holiday@group.v.calendar.google.com"),
    ).toBe(false);
    expect(
      isGoogleCalendarBirthdays("sgdfgsdfgsdfgsdf@group.calendar.google.com"),
    ).toBe(false);
    expect(
      isGoogleCalendarBirthdays("gsdfgsdfgsdfgsdf@import.calendar.google.com"),
    ).toBe(false);
    expect(isGoogleCalendarBirthdays("pol@noloco.io")).toBe(false);
    expect(
      isGoogleCalendarBirthdays("sgdfgsdfgsdfgdfs@group.calendar.google.com"),
    ).toBe(false);
  });
});
