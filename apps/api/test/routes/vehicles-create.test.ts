import request from "supertest";
import { describe, expect, it } from "vitest";
import { vehicles } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { asJson } from "../helpers/vehicles.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const validBody = {
  make: "Toyota",
  model: "Camry",
  category: "sedan",
  price: 25000,
  quantity: 3,
};

async function create(body: unknown, role: "user" | "admin" = "admin") {
  return request(buildApp())
    .post("/api/vehicles")
    .set("Authorization", await bearer(role))
    .send(body as object);
}

describe("POST /api/vehicles", () => {
  it("returns 201 with the stored vehicle, trimming make and model and defaulting imageUrl to null", async () => {
    const response = await create({ ...validBody, make: "  Toyota ", model: " Camry  " });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ ...validBody, imageUrl: null });
    expect(response.body.id).toMatch(UUID);
    const rows = await testDatabase.db.select().from(vehicles);
    expect(rows).toHaveLength(1);
    expect(response.body).toEqual(asJson(rows[0] as (typeof rows)[number]));
  });

  it("stores the imageUrl when one is given", async () => {
    const imageUrl = "https://images.example.com/camry.jpg";

    const response = await create({ ...validBody, imageUrl });

    expect(response.status).toBe(201);
    expect(response.body.imageUrl).toBe(imageUrl);
  });
});
