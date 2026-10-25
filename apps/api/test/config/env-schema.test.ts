import { describe, expect, it } from "vitest";
import { parseEnv } from "../../src/config/env-schema.js";

const validSource = {
  NODE_ENV: "production",
  PORT: "8080",
  DATABASE_URL: "postgres://user:pass@localhost:5432/app",
  TEST_DATABASE_URL: "postgres://user:pass@localhost:5433/app_test",
  JWT_SECRET: "a".repeat(32),
  JWT_EXPIRES_IN: "1h",
  WEB_ORIGIN: "http://localhost:5173",
};

describe("parseEnv", () => {
  it("returns typed config for a valid environment", () => {
    expect(parseEnv(validSource)).toEqual({
      NODE_ENV: "production",
      PORT: 8080,
      DATABASE_URL: "postgres://user:pass@localhost:5432/app",
      TEST_DATABASE_URL: "postgres://user:pass@localhost:5433/app_test",
      JWT_SECRET: "a".repeat(32),
      JWT_EXPIRES_IN: "1h",
      WEB_ORIGIN: "http://localhost:5173",
    });
  });

  it("rejects a JWT_SECRET shorter than 32 characters", () => {
    expect(() => parseEnv({ ...validSource, JWT_SECRET: "a".repeat(31) })).toThrow(/JWT_SECRET/);
  });

  it("throws a readable message naming every invalid key", () => {
    const { DATABASE_URL: _omitted, ...withoutDatabaseUrl } = validSource;

    expect(() => parseEnv({ ...withoutDatabaseUrl, JWT_SECRET: "short" })).toThrow(
      /^Invalid environment variables:\n[\s\S]*DATABASE_URL[\s\S]*JWT_SECRET/,
    );
  });
});
