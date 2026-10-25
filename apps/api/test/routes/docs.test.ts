import { compileErrors, validate } from "@readme/openapi-parser";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";

const ROUTE_PATHS = [
  "/api/health",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/me",
  "/api/vehicles",
  "/api/vehicles/search",
  "/api/vehicles/{id}",
  "/api/vehicles/{id}/purchase",
  "/api/vehicles/{id}/restock",
];

describe("GET /api/openapi.json", () => {
  it("returns a valid OpenAPI 3.1 document listing every route path", async () => {
    const response = await request(buildApp()).get("/api/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.1.0");
    const result = await validate(structuredClone(response.body));
    expect(result.valid, result.valid ? "" : compileErrors(result)).toBe(true);
    expect(Object.keys(response.body.paths).sort()).toEqual([...ROUTE_PATHS].sort());
  });
});

describe("GET /api/docs", () => {
  it("returns the API reference as an HTML page", async () => {
    await request(buildApp())
      .get("/api/docs")
      .expect(200)
      .expect("content-type", /text\/html/);
  });
});
