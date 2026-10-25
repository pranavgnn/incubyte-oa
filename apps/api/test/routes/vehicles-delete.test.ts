import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { vehicles } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { insertVehicle } from "../helpers/vehicles.js";

async function remove(id: string, role: "user" | "admin" = "admin") {
  return request(buildApp())
    .delete(`/api/vehicles/${id}`)
    .set("Authorization", await bearer(role));
}

async function storedIds(): Promise<string[]> {
  const rows = await testDatabase.db.select({ id: vehicles.id }).from(vehicles);
  return rows.map(({ id }) => id);
}

describe("DELETE /api/vehicles/:id", () => {
  it("returns 204 with no body and removes only that vehicle", async () => {
    const doomed = await insertVehicle();
    const kept = await insertVehicle();

    const response = await remove(doomed.id);

    expect(response.status).toBe(204);
    expect(response.text).toBe("");
    expect(await storedIds()).toEqual([kept.id]);
  });

  it("returns 403 FORBIDDEN for a non-admin and keeps the vehicle", async () => {
    const vehicle = await insertVehicle();

    const response = await remove(vehicle.id, "user");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(await storedIds()).toEqual([vehicle.id]);
  });

  it("returns 401 without a bearer token", async () => {
    const vehicle = await insertVehicle();

    const response = await request(buildApp()).delete(`/api/vehicles/${vehicle.id}`);

    expect(response.status).toBe(401);
  });

  it("returns 404 NOT_FOUND when no vehicle has the id", async () => {
    const response = await remove(randomUUID());

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Vehicle not found", details: [] },
    });
  });

  it("returns 400 VALIDATION_ERROR when the id is not a uuid", async () => {
    const response = await remove("42");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toContainEqual(expect.objectContaining({ path: ["id"] }));
  });
});
