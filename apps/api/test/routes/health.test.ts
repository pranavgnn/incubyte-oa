import request from "supertest";
import { describe, expect, it } from "vitest";
import type { HealthRepository } from "../../src/services/health-service.js";
import { buildApp } from "../helpers/build-app.js";

const unreachableDatabase: HealthRepository = {
  ping: () => Promise.reject(new Error("connect ECONNREFUSED 10.0.0.5:5432")),
};

describe("GET /api/health", () => {
  it("returns 200 with status ok when the database is reachable", async () => {
    await request(buildApp()).get("/api/health").expect(200, { status: "ok" });
  });

  it("returns 503 in the error shape without leaking the db error when the database is unreachable", async () => {
    const response = await request(buildApp({ healthRepository: unreachableDatabase })).get(
      "/api/health",
    );

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: { code: "SERVICE_UNAVAILABLE", message: "Database is unreachable", details: [] },
    });
    expect(response.text).not.toContain("ECONNREFUSED");
  });
});
