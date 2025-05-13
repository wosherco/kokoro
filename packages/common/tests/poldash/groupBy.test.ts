import { describe, expect, it } from "vitest";

import { groupBy } from "../../src/poldash";

describe("groupBy", () => {
  it("should group array elements by a function", () => {
    const result = groupBy([6.1, 4.2, 6.3], Math.floor);
    expect(result).toEqual({ 6: [6.1, 6.3], 4: [4.2] });
  });

  it("should group array elements by object property", () => {
    const collection = [
      { id: 1, name: "Alice", category: "A" },
      { id: 2, name: "Bob", category: "B" },
      { id: 3, name: "Charlie", category: "A" },
    ];
    const result = groupBy(collection, "category");
    expect(result).toEqual({
      A: [
        { id: 1, name: "Alice", category: "A" },
        { id: 3, name: "Charlie", category: "A" },
      ],
      B: [{ id: 2, name: "Bob", category: "B" }],
    });
  });

  it("should handle empty arrays", () => {
    const result = groupBy([], (x) => x);
    expect(result).toEqual({});
  });

  it("should group strings by length", () => {
    const result = groupBy(["one", "two", "three", "four", "five"], "length");
    expect(result).toEqual({
      3: ["one", "two"],
      4: ["four", "five"],
      5: ["three"],
    });
  });

  it("should group object values", () => {
    const collection = {
      a: { value: 1, type: "number" },
      b: { value: "hello", type: "string" },
      c: { value: 2, type: "number" },
      d: { value: "world", type: "string" },
    };
    const result = groupBy(collection, "type");
    expect(result).toEqual({
      number: [
        { value: 1, type: "number" },
        { value: 2, type: "number" },
      ],
      string: [
        { value: "hello", type: "string" },
        { value: "world", type: "string" },
      ],
    });
  });

  it("should handle objects with same keys", () => {
    const collection = [
      { id: 1, tag: "a" },
      { id: 2, tag: "a" },
      { id: 3, tag: "b" },
    ];
    const result = groupBy(collection, "tag");
    expect(result).toEqual({
      a: [
        { id: 1, tag: "a" },
        { id: 2, tag: "a" },
      ],
      b: [{ id: 3, tag: "b" }],
    });
  });
});
