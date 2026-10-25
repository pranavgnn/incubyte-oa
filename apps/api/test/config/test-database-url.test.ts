import { describe, expect, it } from "vitest";
import { resolveTestDatabaseUrl } from "../../src/config/env-schema.js";

const DATABASE_URL = "postgres://user:pass@localhost:5432/app";

describe("resolveTestDatabaseUrl", () => {
  it("returns TEST_DATABASE_URL when it is set and distinct", () => {
    const TEST_DATABASE_URL = "postgres://user:pass@localhost:5433/app_test";

    expect(resolveTestDatabaseUrl({ DATABASE_URL, TEST_DATABASE_URL })).toBe(TEST_DATABASE_URL);
  });

  it("refuses to run when TEST_DATABASE_URL is not set", () => {
    expect(() => resolveTestDatabaseUrl({ DATABASE_URL, TEST_DATABASE_URL: undefined })).toThrow(
      "TEST_DATABASE_URL is not set",
    );
  });

  it("refuses to run when TEST_DATABASE_URL is the same as DATABASE_URL", () => {
    expect(() => resolveTestDatabaseUrl({ DATABASE_URL, TEST_DATABASE_URL: DATABASE_URL })).toThrow(
      "TEST_DATABASE_URL must differ from DATABASE_URL",
    );
  });
});
