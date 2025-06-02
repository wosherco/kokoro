import { endOfToday, format, startOfToday } from "date-fns";
import { describe, expect, it } from "vitest";
import { handleDateOrDatetime } from "../../src/utils";

describe("handleDateOrDatetime", () => {
  it("should handle datetime", () => {
    const date = new Date();
    const result = handleDateOrDatetime(date, true);
    expect(result.toISOString()).toBe(date.toISOString());
  });

  it("should handle date start", () => {
    const date = new Date();
    const dateString = format(date, "yyyy-MM-dd");
    const result = handleDateOrDatetime(dateString, true);
    expect(result.toISOString()).toBe(startOfToday().toISOString());
  });

  it("should handle date end", () => {
    const date = new Date();
    const dateString = format(date, "yyyy-MM-dd");
    const result = handleDateOrDatetime(dateString, false);
    expect(result.toISOString()).toBe(endOfToday().toISOString());
  });
});
