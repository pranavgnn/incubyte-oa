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
});
