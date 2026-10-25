import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";

describe("GET /api/vehicles", () => {
  it("returns 401 Authentication required without a bearer token", async () => {
    const response = await request(buildApp()).get("/api/vehicles");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: { code: "UNAUTHORIZED", message: "Authentication required", details: [] },
    });
  });
});
