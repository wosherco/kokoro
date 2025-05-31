import { describe, expect, it } from "vitest";

import { lookup } from "../../src/poldash";

describe("lookup", () => {
  it("should create a lookup function for objects by property", () => {
    const users = [
      { id: 1, name: "John", email: "john@example.com" },
      { id: 2, name: "Jane", email: "jane@example.com" },
      { id: 3, name: "Bob", email: "bob@example.com" },
    ];

    const getUserById = lookup(users, "id");

    expect(getUserById(1)).toEqual({
      id: 1,
      name: "John",
      email: "john@example.com",
    });
    expect(getUserById(2)).toEqual({
      id: 2,
      name: "Jane",
      email: "jane@example.com",
    });
    expect(getUserById(4)).toBeUndefined();
  });

  it("should create a lookup function with a selector function", () => {
    const users = [
      { id: 1, name: "John", email: "john@example.com" },
      { id: 2, name: "Jane", email: "jane@example.com" },
      { id: 3, name: "Bob", email: "bob@example.com" },
    ];

    const getUserByEmail = lookup(users, (user) => user.email);

    expect(getUserByEmail("john@example.com")).toEqual({
      id: 1,
      name: "John",
      email: "john@example.com",
    });
    expect(getUserByEmail("jane@example.com")).toEqual({
      id: 2,
      name: "Jane",
      email: "jane@example.com",
    });
    expect(getUserByEmail("unknown@example.com")).toBeUndefined();
  });

  it("should handle object collections", () => {
    const users = {
      user1: { id: 1, name: "John", email: "john@example.com" },
      user2: { id: 2, name: "Jane", email: "jane@example.com" },
      user3: { id: 3, name: "Bob", email: "bob@example.com" },
    };

    const getUserById = lookup(users, "id");

    expect(getUserById(1)).toEqual({
      id: 1,
      name: "John",
      email: "john@example.com",
    });
    expect(getUserById(2)).toEqual({
      id: 2,
      name: "Jane",
      email: "jane@example.com",
    });
    expect(getUserById(4)).toBeUndefined();
  });

  it("should handle empty collections", () => {
    const users: { id: number; name: string }[] = [];
    const getUserById = lookup(users, "id");

    expect(getUserById(1)).toBeUndefined();
  });

  it("should handle duplicate keys by keeping the last value", () => {
    const users = [
      { id: 1, name: "John", email: "john@example.com" },
      { id: 2, name: "Jane", email: "jane@example.com" },
      { id: 1, name: "New John", email: "newjohn@example.com" },
    ];

    const getUserById = lookup(users, "id");

    expect(getUserById(1)).toEqual({
      id: 1,
      name: "New John",
      email: "newjohn@example.com",
    });
    expect(getUserById(2)).toEqual({
      id: 2,
      name: "Jane",
      email: "jane@example.com",
    });
  });

  it("should handle Date objects by converting to unix timestamps", () => {
    const events = [
      { date: new Date("2023-01-01T10:00:00Z"), title: "New Year Event" },
      { date: new Date("2023-12-25T18:00:00Z"), title: "Christmas Party" },
      { date: new Date("2023-07-04T12:00:00Z"), title: "Independence Day" },
    ];

    const getEventByDate = lookup(events, "date");

    expect(getEventByDate(new Date("2023-01-01T10:00:00Z"))).toEqual({
      date: new Date("2023-01-01T10:00:00Z"),
      title: "New Year Event",
    });

    expect(getEventByDate(new Date("2023-12-25T18:00:00Z"))).toEqual({
      date: new Date("2023-12-25T18:00:00Z"),
      title: "Christmas Party",
    });

    // Different date should not match
    expect(getEventByDate(new Date("2023-01-02T10:00:00Z"))).toBeUndefined();
  });

  it("should handle Date objects with function selectors", () => {
    const schedules = [
      {
        startTime: new Date("2023-01-01T09:00:00Z"),
        activity: "Morning Meeting",
        duration: 60,
      },
      {
        startTime: new Date("2023-01-01T14:00:00Z"),
        activity: "Afternoon Workshop",
        duration: 120,
      },
      {
        startTime: new Date("2023-01-02T09:00:00Z"),
        activity: "Daily Standup",
        duration: 30,
      },
    ];

    const getScheduleByStartTime = lookup(
      schedules,
      (schedule) => schedule.startTime,
    );

    expect(getScheduleByStartTime(new Date("2023-01-01T09:00:00Z"))).toEqual({
      startTime: new Date("2023-01-01T09:00:00Z"),
      activity: "Morning Meeting",
      duration: 60,
    });

    expect(getScheduleByStartTime(new Date("2023-01-01T14:00:00Z"))).toEqual({
      startTime: new Date("2023-01-01T14:00:00Z"),
      activity: "Afternoon Workshop",
      duration: 120,
    });

    expect(
      getScheduleByStartTime(new Date("2023-01-03T09:00:00Z")),
    ).toBeUndefined();
  });

  it("should handle Date equality correctly for single lookup", () => {
    const baseTime = new Date("2023-01-01T10:00:00Z");
    const events = [
      { timestamp: baseTime, event: "start" },
      { timestamp: new Date(baseTime.getTime()), event: "duplicate" },
    ];

    const getEventByTimestamp = lookup(events, "timestamp");

    // Should find the last event with the same timestamp
    expect(getEventByTimestamp(new Date(baseTime.getTime()))).toEqual({
      timestamp: new Date(baseTime.getTime()),
      event: "duplicate",
    });

    expect(getEventByTimestamp(baseTime)).toEqual({
      timestamp: new Date(baseTime.getTime()),
      event: "duplicate",
    });
  });

  it("should handle Date precision correctly for single lookup", () => {
    const baseTime = new Date("2023-01-01T10:00:00.000Z");
    const preciseTime = new Date("2023-01-01T10:00:00.001Z");

    const logs = [
      { timestamp: baseTime, message: "First log" },
      { timestamp: preciseTime, message: "Precise log" },
    ];

    const getLogByTimestamp = lookup(logs, "timestamp");

    expect(getLogByTimestamp(baseTime)).toEqual({
      timestamp: baseTime,
      message: "First log",
    });

    expect(getLogByTimestamp(preciseTime)).toEqual({
      timestamp: preciseTime,
      message: "Precise log",
    });

    // 1 millisecond difference should not match
    expect(
      getLogByTimestamp(new Date("2023-01-01T10:00:00.002Z")),
    ).toBeUndefined();
  });
});
