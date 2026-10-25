import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { vehicles } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { asJson, insertVehicle } from "../helpers/vehicles.js";

async function restock(id: string, body: unknown, role: "user" | "admin" = "admin") {
  return request(buildApp())
    .post(`/api/vehicles/${id}/restock`)
    .set("Authorization", await bearer(role))
    .send(body as object);
}

async function storedVehicle(id: string) {
  const [row] = await testDatabase.db.select().from(vehicles).where(eq(vehicles.id, id));
  return row;
}

const LONG_AGO = new Date("2026-01-01T00:00:00Z");

describe("POST /api/vehicles/:id/restock", () => {
  it.each([
    { before: 0, add: 5, after: 5 },
    { before: 2, add: 1, after: 3 },
    { before: 7, add: 1000, after: 1007 },
  ])(
    "adds $add units to $before for an admin: 200 with the vehicle at $after",
    async ({ before, add, after }) => {
      const vehicle = await insertVehicle({ quantity: before, updatedAt: LONG_AGO });

      const response = await restock(vehicle.id, { quantity: add });

      expect(response.status).toBe(200);
      const stored = await storedVehicle(vehicle.id);
      expect(stored?.quantity).toBe(after);
      expect(stored?.updatedAt.getTime()).toBeGreaterThan(LONG_AGO.getTime());
      expect(response.body).toEqual(asJson(stored as NonNullable<typeof stored>));
    },
  );
});
