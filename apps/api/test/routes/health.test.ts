import request from "supertest";
import { describe, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";

describe("GET /api/health", () => {
  it("returns 200 with status ok when the database is reachable", async () => {
    await request(buildApp()).get("/api/health").expect(200, { status: "ok" });
  });
});
