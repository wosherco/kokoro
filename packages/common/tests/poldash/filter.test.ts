import { describe, expect, it } from "vitest";

import { filterNil, filterNull, filterUndefined } from "../../src/poldash";

describe("filterNull", () => {
  it("should filter out null values from an array", () => {
    const array = [1, null, 2, null, 3];
    const result = filterNull(array);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should keep undefined values", () => {
    const array = [1, null, 2, undefined, 3];
    const result = filterNull(array);
    expect(result).toEqual([1, 2, undefined, 3]);
  });

  it("should handle empty arrays", () => {
    const array: (number | null)[] = [];
    const result = filterNull(array);
    expect(result).toEqual([]);
  });

  it("should handle arrays with no null values", () => {
    const array = [1, 2, 3];
    const result = filterNull(array);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle arrays with only null values", () => {
    const array = [null, null, null];
    const result = filterNull(array);
    expect(result).toEqual([]);
  });
});

describe("filterUndefined", () => {
  it("should filter out undefined values from an array", () => {
    const array = [1, undefined, 2, undefined, 3];
    const result = filterUndefined(array);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should keep null values", () => {
    const array = [1, null, 2, undefined, 3];
    const result = filterUndefined(array);
    expect(result).toEqual([1, null, 2, 3]);
  });

  it("should handle empty arrays", () => {
    const array: (number | undefined)[] = [];
    const result = filterUndefined(array);
    expect(result).toEqual([]);
  });

  it("should handle arrays with no undefined values", () => {
    const array = [1, 2, 3];
    const result = filterUndefined(array);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle arrays with only undefined values", () => {
    const array = [undefined, undefined, undefined];
    const result = filterUndefined(array);
    expect(result).toEqual([]);
  });
});

describe("filterNil", () => {
  it("should filter out both null and undefined values from an array", () => {
    const array = [1, null, 2, undefined, 3, null, undefined];
    const result = filterNil(array);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle empty arrays", () => {
    const array: (number | null | undefined)[] = [];
    const result = filterNil(array);
    expect(result).toEqual([]);
  });

  it("should handle arrays with no null or undefined values", () => {
    const array = [1, 2, 3];
    const result = filterNil(array);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle arrays with only null and undefined values", () => {
    const array = [null, undefined, null, undefined];
    const result = filterNil(array);
    expect(result).toEqual([]);
  });

  it("should handle mixed type arrays", () => {
    const array = ["hello", null, 42, undefined, true, null];
    const result = filterNil(array);
    expect(result).toEqual(["hello", 42, true]);
  });
});
