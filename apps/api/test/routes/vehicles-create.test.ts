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

  it("returns 403 FORBIDDEN for a non-admin and creates nothing", async () => {
    const response = await create(validBody, "user");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Insufficient permissions", details: [] },
    });
    expect(await testDatabase.db.select().from(vehicles)).toHaveLength(0);
  });

  it("returns 401 without a bearer token", async () => {
    const response = await request(buildApp()).post("/api/vehicles").send(validBody);

    expect(response.status).toBe(401);
  });

  const { make: _make, ...withoutMake } = validBody;

  it.each([
    { label: "make is empty", body: { ...validBody, make: "" }, path: "make" },
    { label: "make is only whitespace", body: { ...validBody, make: "   " }, path: "make" },
    { label: "make is missing", body: withoutMake, path: "make" },
    { label: "model is only whitespace", body: { ...validBody, model: " " }, path: "model" },
    { label: "category is unknown", body: { ...validBody, category: "bike" }, path: "category" },
    { label: "price is zero", body: { ...validBody, price: 0 }, path: "price" },
    { label: "price is negative", body: { ...validBody, price: -100 }, path: "price" },
    { label: "price is not an integer", body: { ...validBody, price: 199.99 }, path: "price" },
    { label: "price is a string", body: { ...validBody, price: "25000" }, path: "price" },
    { label: "price overflows int32", body: { ...validBody, price: 2 ** 31 }, path: "price" },
    { label: "quantity is negative", body: { ...validBody, quantity: -1 }, path: "quantity" },
    {
      label: "quantity is not an integer",
      body: { ...validBody, quantity: 1.5 },
      path: "quantity",
    },
    {
      label: "quantity overflows int32",
      body: { ...validBody, quantity: 2 ** 31 },
      path: "quantity",
    },
    {
      label: "imageUrl uses http",
      body: { ...validBody, imageUrl: "http://images.example.com/a.jpg" },
      path: "imageUrl",
    },
    {
      label: "imageUrl is not a URL",
      body: { ...validBody, imageUrl: "camry.jpg" },
      path: "imageUrl",
    },
    { label: "an unknown key is sent", body: { ...validBody, id: "x" }, path: "" },
  ])("returns 400 VALIDATION_ERROR when $label, creating nothing", async ({ body, path }) => {
    const response = await create(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toContainEqual(
      expect.objectContaining({ path: path === "" ? [] : [path] }),
    );
    expect(await testDatabase.db.select().from(vehicles)).toHaveLength(0);
  });

  it("accepts a quantity of zero, so sold-out stock can be listed", async () => {
    const response = await create({ ...validBody, quantity: 0 });

    expect(response.status).toBe(201);
    expect(response.body.quantity).toBe(0);
  });
});
