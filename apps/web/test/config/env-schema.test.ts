import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env-schema";

describe("parseEnv", () => {
  it("returns frozen, typed config for a valid environment", () => {
    const env = parseEnv({ VITE_API_URL: "https://api.example.com" });

    expect(env).toEqual({ VITE_API_URL: "https://api.example.com" });
    expect(Object.isFrozen(env)).toBe(true);
  });
});
