import { describe, expect, it } from "vitest";

import { isNil } from "../../src/poldash/isNil";

describe("isNil", () => {
  it("should return true for null values", () => {
    expect(isNil(null)).toBe(true);
  });

  it("should return true for undefined values", () => {
    expect(isNil(undefined)).toBe(true);
  });

  it("should return false for number values including zero", () => {
    expect(isNil(0)).toBe(false);
    expect(isNil(42)).toBe(false);
    expect(isNil(-1)).toBe(false);
    expect(isNil(Number.NaN)).toBe(false);
  });

  it("should return false for string values including empty string", () => {
    expect(isNil("")).toBe(false);
    expect(isNil("hello")).toBe(false);
  });

  it("should return false for boolean values", () => {
    expect(isNil(true)).toBe(false);
    expect(isNil(false)).toBe(false);
  });

  it("should return false for objects including empty objects", () => {
    expect(isNil({})).toBe(false);
    expect(isNil({ a: 1 })).toBe(false);
  });

  it("should return false for arrays including empty arrays", () => {
    expect(isNil([])).toBe(false);
    expect(isNil([1, 2, 3])).toBe(false);
  });

  it("should return false for functions", () => {
    expect(
      isNil(() => {
        // Empty
      }),
    ).toBe(false);

    expect(
      isNil(() => {
        // Empty
      }),
    ).toBe(false);
  });

  it("should return false for symbols", () => {
    expect(isNil(Symbol())).toBe(false);
    expect(isNil(Symbol("test"))).toBe(false);
  });

  it("should return false for dates", () => {
    expect(isNil(new Date())).toBe(false);
  });
});
