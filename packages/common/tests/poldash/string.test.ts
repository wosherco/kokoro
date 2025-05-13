import { describe, expect, it } from "vitest";

import {
  escapeDoubleQuotes,
  escapeHtml,
  escapeRegExp,
  truncate,
} from "../../src/poldash";

describe("truncate", () => {
  it("should truncate strings that exceed maxLength", () => {
    expect(truncate("Hello world", 5)).toBe("He...");
    expect(truncate("Hello world", 8)).toBe("Hello...");
    expect(truncate("Hello world", 10)).toBe("Hello w...");
  });

  it("should not truncate strings that are shorter than maxLength", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
    expect(truncate("", 5)).toBe("");
  });

  it("should respect custom suffixes", () => {
    expect(truncate("Hello world", 7, "…")).toBe("Hello …");
    expect(truncate("Hello world", 9, "[more]")).toBe("Hel[more]");
    expect(truncate("Hello world", 5, "")).toBe("Hello");
  });

  it("should handle edge cases with very short maxLength", () => {
    expect(truncate("Hello", 3, "...")).toBe("Hel");
    expect(truncate("Hello", 2, "...")).toBe("He");
    expect(truncate("Hello", 0, "...")).toBe("");
  });
});

describe("escapeDoubleQuotes", () => {
  it("should escape double quotes", () => {
    expect(escapeDoubleQuotes('Hello "world"')).toBe('Hello \\"world\\"');
    expect(escapeDoubleQuotes('"test"')).toBe('\\"test\\"');
  });

  it("should not modify strings without double quotes", () => {
    expect(escapeDoubleQuotes("Hello world")).toBe("Hello world");
    expect(escapeDoubleQuotes("")).toBe("");
  });
});

describe("escapeHtml", () => {
  it("should escape HTML special characters", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
    expect(escapeHtml("<div>Hello & 'world'</div>")).toBe(
      "&lt;div&gt;Hello &amp; &#039;world&#039;&lt;/div&gt;",
    );
    expect(escapeHtml('"test"')).toBe("&quot;test&quot;");
  });

  it("should not modify strings without special characters", () => {
    expect(escapeHtml("Hello world")).toBe("Hello world");
    expect(escapeHtml("")).toBe("");
  });
});

describe("escapeRegExp", () => {
  it("should escape regex special characters", () => {
    expect(escapeRegExp("hello.world")).toBe("hello\\.world");
    expect(escapeRegExp("(test)")).toBe("\\(test\\)");
    expect(escapeRegExp("[abc]+*?")).toBe("\\[abc\\]\\+\\*\\?");
  });

  it("should not modify strings without regex special characters", () => {
    expect(escapeRegExp("Hello world")).toBe("Hello world");
    expect(escapeRegExp("")).toBe("");
  });

  it("should correctly escape backslashes", () => {
    expect(escapeRegExp("test\\word")).toBe("test\\\\word");
  });
});
