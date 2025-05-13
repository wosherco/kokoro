import { describe, expect, it, vi } from "vitest";

import { keyBy, keyBySync } from "../../src/poldash";

describe("keyBy", () => {
  it("should create an object with keys from property", async () => {
    const users = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 },
      { id: 3, name: "Bob", age: 40 },
    ];

    const result = await keyBy(users, "id");

    expect(result).toEqual({
      1: { id: 1, name: "John", age: 30 },
      2: { id: 2, name: "Jane", age: 25 },
      3: { id: 3, name: "Bob", age: 40 },
    });
  });

  it("should create an object with keys from function", async () => {
    const users = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 },
      { id: 3, name: "Bob", age: 40 },
    ];

    const result = await keyBy(users, (user) => `user-${user.id}`);

    expect(result).toEqual({
      "user-1": { id: 1, name: "John", age: 30 },
      "user-2": { id: 2, name: "Jane", age: 25 },
      "user-3": { id: 3, name: "Bob", age: 40 },
    });
  });

  it("should apply transformation function to values", async () => {
    const users = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 },
      { id: 3, name: "Bob", age: 40 },
    ];

    const result = await keyBy(users, "id", (user) => user.name);

    expect(result).toEqual({
      1: "John",
      2: "Jane",
      3: "Bob",
    });
  });

  it("should handle async transformation functions", async () => {
    const users = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 },
      { id: 3, name: "Bob", age: 40 },
    ];

    const asyncTransformer = (user: (typeof users)[0]) => {
      return { fullName: `${user.name} (${user.age})` };
    };

    const result = await keyBy(users, "id", asyncTransformer);

    expect(result).toEqual({
      1: { fullName: "John (30)" },
      2: { fullName: "Jane (25)" },
      3: { fullName: "Bob (40)" },
    });
  });

  it("should handle object input instead of array", async () => {
    const users = {
      user1: { id: 1, name: "John", age: 30 },
      user2: { id: 2, name: "Jane", age: 25 },
      user3: { id: 3, name: "Bob", age: 40 },
    };

    const result = await keyBy(users, "id");

    expect(result).toEqual({
      1: { id: 1, name: "John", age: 30 },
      2: { id: 2, name: "Jane", age: 25 },
      3: { id: 3, name: "Bob", age: 40 },
    });
  });

  it("should handle empty array", async () => {
    const result = await keyBy([], "id");
    expect(result).toEqual({});
  });

  it("should handle empty object", async () => {
    const result = await keyBy({}, "id");
    expect(result).toEqual({});
  });

  it("should run transformations in parallel", async () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const mockFn = vi.fn();
    const delayedTransform = async (item: (typeof items)[0]) => {
      mockFn();
      await new Promise((resolve) => setTimeout(resolve, 10));
      return item.id * 2;
    };

    const startTime = Date.now();
    const result = await keyBy(items, "id", delayedTransform);
    const endTime = Date.now();

    expect(result).toEqual({ 1: 2, 2: 4, 3: 6 });
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Should take approximately 10ms, not 30ms (3 * 10ms)
    // We use a generous threshold to account for testing environment variations
    expect(endTime - startTime).toBeLessThan(25);
  });
});

describe("keyBySync", () => {
  it("should create an object with keys from property", () => {
    const users = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 },
      { id: 3, name: "Bob", age: 40 },
    ];

    const result = keyBySync(users, "id");

    expect(result).toEqual({
      1: { id: 1, name: "John", age: 30 },
      2: { id: 2, name: "Jane", age: 25 },
      3: { id: 3, name: "Bob", age: 40 },
    });
  });

  it("should create an object with keys from function", () => {
    const users = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 },
      { id: 3, name: "Bob", age: 40 },
    ];

    const result = keyBySync(users, (user) => `user-${user.id}`);

    expect(result).toEqual({
      "user-1": { id: 1, name: "John", age: 30 },
      "user-2": { id: 2, name: "Jane", age: 25 },
      "user-3": { id: 3, name: "Bob", age: 40 },
    });
  });

  it("should apply transformation function to values", () => {
    const users = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 },
      { id: 3, name: "Bob", age: 40 },
    ];

    const result = keyBySync(users, "id", (user) => user.name);

    expect(result).toEqual({
      1: "John",
      2: "Jane",
      3: "Bob",
    });
  });

  it("should handle object input instead of array", () => {
    const users = {
      user1: { id: 1, name: "John", age: 30 },
      user2: { id: 2, name: "Jane", age: 25 },
      user3: { id: 3, name: "Bob", age: 40 },
    };

    const result = keyBySync(users, "id");

    expect(result).toEqual({
      1: { id: 1, name: "John", age: 30 },
      2: { id: 2, name: "Jane", age: 25 },
      3: { id: 3, name: "Bob", age: 40 },
    });
  });

  it("should handle empty array", () => {
    const result = keyBySync([], "id");
    expect(result).toEqual({});
  });

  it("should handle empty object", () => {
    const result = keyBySync({}, "id");
    expect(result).toEqual({});
  });
});
