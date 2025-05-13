import { describe, expect, it } from "vitest";

import {
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from "../../src/poldash";

describe("toCamelCase", () => {
  it("should convert snake_case to camelCase", () => {
    expect(toCamelCase("hello_world")).toBe("helloWorld");
    expect(toCamelCase("user_first_name")).toBe("userFirstName");
    expect(toCamelCase("_private_var")).toBe("privateVar");
  });

  it("should convert kebab-case to camelCase", () => {
    expect(toCamelCase("hello-world")).toBe("helloWorld");
    expect(toCamelCase("user-first-name")).toBe("userFirstName");
    expect(toCamelCase("-private-var")).toBe("privateVar");
  });

  it("should convert PascalCase to camelCase", () => {
    expect(toCamelCase("HelloWorld")).toBe("helloWorld");
    expect(toCamelCase("UserFirstName")).toBe("userFirstName");
  });

  it("should handle spaces", () => {
    expect(toCamelCase("hello world")).toBe("helloWorld");
    expect(toCamelCase("  spaced  out  ")).toBe("spacedOut");
  });

  it("should handle empty strings", () => {
    expect(toCamelCase("")).toBe("");
  });
});

describe("toPascalCase", () => {
  it("should convert snake_case to PascalCase", () => {
    expect(toPascalCase("hello_world")).toBe("HelloWorld");
    expect(toPascalCase("user_first_name")).toBe("UserFirstName");
  });

  it("should convert kebab-case to PascalCase", () => {
    expect(toPascalCase("hello-world")).toBe("HelloWorld");
    expect(toPascalCase("user-first-name")).toBe("UserFirstName");
  });

  it("should convert camelCase to PascalCase", () => {
    expect(toPascalCase("helloWorld")).toBe("HelloWorld");
    expect(toPascalCase("userFirstName")).toBe("UserFirstName");
  });

  it("should handle spaces", () => {
    expect(toPascalCase("hello world")).toBe("HelloWorld");
    expect(toPascalCase("  spaced  out  ")).toBe("SpacedOut");
  });

  it("should handle empty strings", () => {
    expect(toPascalCase("")).toBe("");
  });
});

describe("toSnakeCase", () => {
  it("should convert camelCase to snake_case", () => {
    expect(toSnakeCase("helloWorld")).toBe("hello_world");
    expect(toSnakeCase("userFirstName")).toBe("user_first_name");
  });

  it("should convert PascalCase to snake_case", () => {
    expect(toSnakeCase("HelloWorld")).toBe("hello_world");
    expect(toSnakeCase("UserFirstName")).toBe("user_first_name");
  });

  it("should convert kebab-case to snake_case", () => {
    expect(toSnakeCase("hello-world")).toBe("hello_world");
    expect(toSnakeCase("user-first-name")).toBe("user_first_name");
  });

  it("should handle spaces", () => {
    expect(toSnakeCase("hello world")).toBe("hello_world");
    expect(toSnakeCase("  spaced  out  ")).toBe("spaced_out");
  });

  it("should handle empty strings", () => {
    expect(toSnakeCase("")).toBe("");
  });
});

describe("toKebabCase", () => {
  it("should convert camelCase to kebab-case", () => {
    expect(toKebabCase("helloWorld")).toBe("hello-world");
    expect(toKebabCase("userFirstName")).toBe("user-first-name");
  });

  it("should convert PascalCase to kebab-case", () => {
    expect(toKebabCase("HelloWorld")).toBe("hello-world");
    expect(toKebabCase("UserFirstName")).toBe("user-first-name");
  });

  it("should convert snake_case to kebab-case", () => {
    expect(toKebabCase("hello_world")).toBe("hello-world");
    expect(toKebabCase("user_first_name")).toBe("user-first-name");
  });

  it("should handle spaces", () => {
    expect(toKebabCase("hello world")).toBe("hello-world");
    expect(toKebabCase("  spaced  out  ")).toBe("spaced-out");
  });

  it("should handle empty strings", () => {
    expect(toKebabCase("")).toBe("");
  });
});

describe("toConstantCase", () => {
  it("should convert camelCase to CONSTANT_CASE", () => {
    expect(toConstantCase("helloWorld")).toBe("HELLO_WORLD");
    expect(toConstantCase("userFirstName")).toBe("USER_FIRST_NAME");
  });

  it("should convert PascalCase to CONSTANT_CASE", () => {
    expect(toConstantCase("HelloWorld")).toBe("HELLO_WORLD");
    expect(toConstantCase("UserFirstName")).toBe("USER_FIRST_NAME");
  });

  it("should convert kebab-case to CONSTANT_CASE", () => {
    expect(toConstantCase("hello-world")).toBe("HELLO_WORLD");
    expect(toConstantCase("user-first-name")).toBe("USER_FIRST_NAME");
  });

  it("should handle spaces", () => {
    expect(toConstantCase("hello world")).toBe("HELLO_WORLD");
    expect(toConstantCase("  spaced  out  ")).toBe("SPACED_OUT");
  });

  it("should handle empty strings", () => {
    expect(toConstantCase("")).toBe("");
  });
});
