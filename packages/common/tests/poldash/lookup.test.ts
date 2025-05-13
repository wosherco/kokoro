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
});
