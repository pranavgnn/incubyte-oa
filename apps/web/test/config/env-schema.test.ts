import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env-schema";

describe("parseEnv", () => {
  it("returns frozen, typed config for a valid environment", () => {
    const env = parseEnv({ VITE_API_URL: "https://api.example.com" });

    expect(env).toEqual({ VITE_API_URL: "https://api.example.com" });
    expect(Object.isFrozen(env)).toBe(true);
  });

  it.each([
    ["missing", {}],
    ["not a URL", { VITE_API_URL: "localhost:3000" }],
  ])("rejects a VITE_API_URL that is %s, naming the key", (_label, source) => {
    expect(() => parseEnv(source)).toThrow(/VITE_API_URL/);
  });
});
