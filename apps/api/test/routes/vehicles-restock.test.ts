import { randomUUID } from "node:crypto";
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

  it("returns 403 FORBIDDEN for a non-admin and leaves stock alone", async () => {
    const vehicle = await insertVehicle({ quantity: 2 });

    const response = await restock(vehicle.id, { quantity: 5 }, "user");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect((await storedVehicle(vehicle.id))?.quantity).toBe(2);
  });

  it("returns 401 without a bearer token", async () => {
    const vehicle = await insertVehicle();

    const response = await request(buildApp())
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .send({ quantity: 5 });

    expect(response.status).toBe(401);
  });

  it.each([
    { label: "quantity is 0", body: { quantity: 0 }, path: ["quantity"] },
    { label: "quantity is negative", body: { quantity: -3 }, path: ["quantity"] },
    { label: "quantity is above 1000", body: { quantity: 1001 }, path: ["quantity"] },
    { label: "quantity is not an integer", body: { quantity: 2.5 }, path: ["quantity"] },
    { label: "quantity is a string", body: { quantity: "5" }, path: ["quantity"] },
    { label: "quantity is missing", body: {}, path: ["quantity"] },
    { label: "an unknown key is sent", body: { quantity: 5, price: 1 }, path: [] },
  ])("returns 400 VALIDATION_ERROR when $label, leaving stock alone", async ({ body, path }) => {
    const vehicle = await insertVehicle({ quantity: 2 });

    const response = await restock(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toContainEqual(expect.objectContaining({ path }));
    expect((await storedVehicle(vehicle.id))?.quantity).toBe(2);
  });

  it("returns 400 VALIDATION_ERROR when the id is not a uuid", async () => {
    const response = await restock("nope", { quantity: 5 });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContainEqual(expect.objectContaining({ path: ["id"] }));
  });

  it("returns 404 NOT_FOUND when no vehicle has the id", async () => {
    const response = await restock(randomUUID(), { quantity: 5 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Vehicle not found", details: [] },
    });
  });
});
