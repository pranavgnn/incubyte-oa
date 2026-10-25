import { describe, expect, it } from "vitest";
import { resolveTestDatabaseUrl } from "../../src/config/env-schema.js";

const DATABASE_URL = "postgres://user:pass@localhost:5432/app";

describe("resolveTestDatabaseUrl", () => {
  it("refuses to run when TEST_DATABASE_URL is not set", () => {
    expect(() => resolveTestDatabaseUrl({ DATABASE_URL, TEST_DATABASE_URL: undefined })).toThrow(
      "TEST_DATABASE_URL is not set",
    );
  });
});
