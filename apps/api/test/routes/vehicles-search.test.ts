import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { insertVehicle } from "../helpers/vehicles.js";

async function search(query: Partial<Record<string, string>>) {
  return request(buildApp())
    .get("/api/vehicles/search")
    .query(query)
    .set("Authorization", await bearer("user"));
}

// Inserted oldest first with distinct timestamps, so newest-first order
// is predictable.
async function seedCatalogue() {
  const rows = [
    { make: "Toyota", model: "Corolla", category: "sedan", price: 20000 },
    { make: "Toyota", model: "Supra", category: "coupe", price: 55000 },
    { make: "Honda", model: "Civic", category: "hatchback", price: 22000, quantity: 0 },
    { make: "Ford", model: "Transit", category: "van", price: 40000 },
    { make: "Tesla", model: "Model 3", category: "electric", price: 42000 },
  ] as const;
  for (const [index, row] of rows.entries()) {
    await insertVehicle({ ...row, createdAt: new Date(Date.UTC(2026, 0, index + 1)) });
  }
}

function models(body: { model: string }[]): string[] {
  return body.map(({ model }) => model);
}

describe("GET /api/vehicles/search", () => {
  it.each([
    { q: "toy", expected: ["Supra", "Corolla"] },
    { q: "CIVIC", expected: ["Civic"] },
    { q: "orol", expected: ["Corolla"] },
    { q: "nissan", expected: [] },
  ])(
    "matches q=$q case-insensitively against make or model, newest first",
    async ({ q, expected }) => {
      await seedCatalogue();

      const response = await search({ q });

      expect(response.status).toBe(200);
      expect(models(response.body)).toEqual(expected);
    },
  );

  it.each([
    { query: { make: "toyota" }, expected: ["Supra", "Corolla"] },
    { query: { make: "O" }, expected: ["Transit", "Civic", "Supra", "Corolla"] },
    { query: { model: "A" }, expected: ["Transit", "Supra", "Corolla"] },
    { query: { category: "coupe" }, expected: ["Supra"] },
    { query: { minPrice: "40000" }, expected: ["Model 3", "Transit", "Supra"] },
    { query: { maxPrice: "22000" }, expected: ["Civic", "Corolla"] },
    { query: { minPrice: "40000", maxPrice: "40000" }, expected: ["Transit"] },
    { query: { make: "toyota", maxPrice: "30000" }, expected: ["Corolla"] },
    { query: { q: "t", category: "van" }, expected: ["Transit"] },
  ])(
    "applies every given filter together, prices inclusive: $query",
    async ({ query, expected }) => {
      await seedCatalogue();

      const response = await search(query);

      expect(response.status).toBe(200);
      expect(models(response.body)).toEqual(expected);
    },
  );

  it.each([
    { field: "q", value: "%" },
    { field: "q", value: "_" },
    { field: "make", value: "%" },
    { field: "model", value: "\\" },
  ])("treats LIKE wildcards in $field=$value as literal characters", async ({ field, value }) => {
    await insertVehicle({ make: "Plain", model: "Plain" });
    const literal = await insertVehicle({ make: `A${value}B`, model: `C${value}D` });

    const response = await search({ [field]: value });

    expect(response.status).toBe(200);
    expect(response.body.map(({ id }: { id: string }) => id)).toEqual([literal.id]);
  });

  it("returns every vehicle, out of stock included, when no filter is given", async () => {
    await seedCatalogue();

    const response = await search({});

    expect(response.status).toBe(200);
    expect(models(response.body)).toEqual(["Model 3", "Transit", "Civic", "Supra", "Corolla"]);
  });

  it.each([
    { query: { minPrice: "30000", maxPrice: "20000" }, path: ["minPrice"] },
    { query: { category: "bike" }, path: ["category"] },
    { query: { minPrice: "cheap" }, path: ["minPrice"] },
    { query: { minPrice: "-1" }, path: ["minPrice"] },
    { query: { maxPrice: "1.5" }, path: ["maxPrice"] },
    { query: { maxPrice: String(2 ** 31) }, path: ["maxPrice"] },
    { query: { color: "red" }, path: [] },
  ])("returns 400 VALIDATION_ERROR for $query", async ({ query, path }) => {
    const response = await search(query);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toContainEqual(expect.objectContaining({ path }));
  });

  it("returns 401 without a bearer token", async () => {
    const response = await request(buildApp()).get("/api/vehicles/search");

    expect(response.status).toBe(401);
  });
});
