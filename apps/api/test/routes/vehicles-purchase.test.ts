import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { vehicles } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { asJson, insertVehicle } from "../helpers/vehicles.js";

async function purchase(id: string, role: "user" | "admin" = "user") {
  return request(buildApp())
    .post(`/api/vehicles/${id}/purchase`)
    .set("Authorization", await bearer(role));
}

async function storedVehicle(id: string) {
  const [row] = await testDatabase.db.select().from(vehicles).where(eq(vehicles.id, id));
  return row;
}

const LONG_AGO = new Date("2026-01-01T00:00:00Z");

describe("POST /api/vehicles/:id/purchase", () => {
  it.each(["user", "admin"] as const)(
    "lets a signed-in %s buy one unit: 200 with the vehicle after the decrement",
    async (role) => {
      const vehicle = await insertVehicle({ quantity: 3, updatedAt: LONG_AGO });

      const response = await purchase(vehicle.id, role);

      expect(response.status).toBe(200);
      const stored = await storedVehicle(vehicle.id);
      expect(stored?.quantity).toBe(2);
      expect(stored?.updatedAt.getTime()).toBeGreaterThan(LONG_AGO.getTime());
      expect(response.body).toEqual(asJson(stored as NonNullable<typeof stored>));
    },
  );

  it("sells the last unit, leaving quantity 0", async () => {
    const vehicle = await insertVehicle({ quantity: 1 });

    const response = await purchase(vehicle.id);

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(0);
  });

  it("returns 401 without a bearer token", async () => {
    const vehicle = await insertVehicle();

    const response = await request(buildApp()).post(`/api/vehicles/${vehicle.id}/purchase`);

    expect(response.status).toBe(401);
  });
});
