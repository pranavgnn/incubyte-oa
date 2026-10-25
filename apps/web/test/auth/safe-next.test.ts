import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/auth/safe-next";

describe("safeNextPath", () => {
  it.each([
    ["/", "/"],
    ["/?make=Tata&q=nex", "/?make=Tata&q=nex"],
    ["/vehicles/42", "/vehicles/42"],
  ])("keeps the in-app path %s", (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["an absolute URL", "https://evil.example/phish"],
    ["protocol-relative", "//evil.example"],
    ["a backslash trick", "/\\evil.example"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["relative without a leading slash", "vehicles"],
  ])("falls back to / when next is %s", (_label, next) => {
    expect(safeNextPath(next)).toBe("/");
  });
});
