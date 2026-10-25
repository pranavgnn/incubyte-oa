import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp, TEST_WEB_ORIGIN } from "../helpers/build-app.js";

describe("security middleware", () => {
  it("sets security headers on responses", async () => {
    const response = await request(buildApp()).get("/api/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("allows CORS only from the configured web origin", async () => {
    const app = buildApp();

    const allowed = await request(app).get("/api/health").set("Origin", TEST_WEB_ORIGIN);
    const denied = await request(app).get("/api/health").set("Origin", "https://evil.example");

    expect(allowed.headers["access-control-allow-origin"]).toBe(TEST_WEB_ORIGIN);
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
