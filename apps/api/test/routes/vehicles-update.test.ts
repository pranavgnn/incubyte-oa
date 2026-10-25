import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { vehicles } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { asJson, insertVehicle } from "../helpers/vehicles.js";

async function update(id: string, body: unknown, role: "user" | "admin" = "admin") {
  return request(buildApp())
    .put(`/api/vehicles/${id}`)
    .set("Authorization", await bearer(role))
    .send(body as object);
}

async function storedVehicle(id: string) {
  const [row] = await testDatabase.db.select().from(vehicles).where(eq(vehicles.id, id));
  return row;
}

const LONG_AGO = new Date("2026-01-01T00:00:00Z");

describe("PUT /api/vehicles/:id", () => {
  it("returns 200 with the vehicle after changing only the given fields and bumping updatedAt", async () => {
    const vehicle = await insertVehicle({ createdAt: LONG_AGO, updatedAt: LONG_AGO });

    const response = await update(vehicle.id, { price: 18500, model: "  Corolla Cross " });

    expect(response.status).toBe(200);
    const stored = await storedVehicle(vehicle.id);
    expect(stored).toMatchObject({ price: 18500, model: "Corolla Cross", make: vehicle.make });
    expect(stored?.updatedAt.getTime()).toBeGreaterThan(LONG_AGO.getTime());
    expect(stored?.createdAt).toEqual(LONG_AGO);
    expect(response.body).toEqual(asJson(stored as NonNullable<typeof stored>));
  });

  it("clears the image when imageUrl is null", async () => {
    const vehicle = await insertVehicle({ imageUrl: "https://images.example.com/a.jpg" });

    const response = await update(vehicle.id, { imageUrl: null });

    expect(response.status).toBe(200);
    expect(response.body.imageUrl).toBeNull();
    expect((await storedVehicle(vehicle.id))?.imageUrl).toBeNull();
  });

  it("returns 403 FORBIDDEN for a non-admin and changes nothing", async () => {
    const vehicle = await insertVehicle({ price: 20000 });

    const response = await update(vehicle.id, { price: 1 }, "user");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect((await storedVehicle(vehicle.id))?.price).toBe(20000);
  });

  it("returns 401 without a bearer token", async () => {
    const vehicle = await insertVehicle();

    const response = await request(buildApp())
      .put(`/api/vehicles/${vehicle.id}`)
      .send({ price: 1 });

    expect(response.status).toBe(401);
  });
});
