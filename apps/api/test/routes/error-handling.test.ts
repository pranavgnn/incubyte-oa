import request from "supertest";
import { describe, expect, it } from "vitest";
import { HealthService } from "../../src/services/health-service.js";
import { buildApp } from "../helpers/build-app.js";

// Simulates a bug: a plain Error that no layer translated into an AppError.
class ExplodingHealthService extends HealthService {
  constructor() {
    super({ ping: () => Promise.resolve() });
  }

  override async check(): Promise<void> {
    throw new Error('relation "secret_table" does not exist');
  }
}

describe("error handling", () => {
  it("returns a generic 500 in the error shape for unknown errors without leaking details", async () => {
    const response = await request(buildApp({ healthService: new ExplodingHealthService() })).get(
      "/api/health",
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Internal server error", details: [] },
    });
    expect(response.text).not.toContain("secret_table");
  });
});
