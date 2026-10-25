import { randomUUID } from "node:crypto";
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

  it("returns 409 OUT_OF_STOCK when quantity is 0 and leaves the vehicle untouched", async () => {
    const vehicle = await insertVehicle({ quantity: 0 });

    const response = await purchase(vehicle.id);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: { code: "OUT_OF_STOCK", message: "Vehicle is out of stock", details: [] },
    });
    expect(await storedVehicle(vehicle.id)).toEqual(vehicle);
  });

  it("returns 404 NOT_FOUND when no vehicle has the id", async () => {
    const response = await purchase(randomUUID());

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Vehicle not found", details: [] },
    });
  });

  it("returns 400 VALIDATION_ERROR when the id is not a uuid", async () => {
    const response = await purchase("abc");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toContainEqual(expect.objectContaining({ path: ["id"] }));
  });

  it("accepts an empty JSON object as the body", async () => {
    const vehicle = await insertVehicle({ quantity: 2 });

    const response = await request(buildApp())
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set("Authorization", await bearer("user"))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(1);
  });

  it.each([{ quantity: 2 }, { quantity: 1 }])(
    "returns 400 VALIDATION_ERROR for a body with fields (%o), buying nothing",
    async (body) => {
      const vehicle = await insertVehicle({ quantity: 5 });

      const response = await request(buildApp())
        .post(`/api/vehicles/${vehicle.id}/purchase`)
        .set("Authorization", await bearer("user"))
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect((await storedVehicle(vehicle.id))?.quantity).toBe(5);
    },
  );
});
