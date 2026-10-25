import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { asJson, insertVehicle } from "../helpers/vehicles.js";

describe("GET /api/vehicles", () => {
  it("returns 401 Authentication required without a bearer token", async () => {
    const response = await request(buildApp()).get("/api/vehicles");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: { code: "UNAUTHORIZED", message: "Authentication required", details: [] },
    });
  });

  it("returns 200 with every vehicle, out of stock included, newest first", async () => {
    const oldest = await insertVehicle({
      make: "Honda",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    const soldOut = await insertVehicle({
      make: "Ford",
      quantity: 0,
      createdAt: new Date("2026-02-01T00:00:00Z"),
    });
    const newest = await insertVehicle({
      make: "Tesla",
      category: "electric",
      imageUrl: "https://images.example.com/tesla.jpg",
      createdAt: new Date("2026-03-01T00:00:00Z"),
    });

    const response = await request(buildApp())
      .get("/api/vehicles")
      .set("Authorization", await bearer("user"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([asJson(newest), asJson(soldOut), asJson(oldest)]);
  });

  it("returns 200 with an empty list when there are no vehicles", async () => {
    const response = await request(buildApp())
      .get("/api/vehicles")
      .set("Authorization", await bearer("user"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
