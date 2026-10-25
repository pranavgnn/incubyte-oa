import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { insertVehicle } from "../helpers/vehicles.js";

async function search(query: Record<string, string>) {
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

  it("returns every vehicle, out of stock included, when no filter is given", async () => {
    await seedCatalogue();

    const response = await search({});

    expect(response.status).toBe(200);
    expect(models(response.body)).toEqual(["Model 3", "Transit", "Civic", "Supra", "Corolla"]);
  });

  it("returns 401 without a bearer token", async () => {
    const response = await request(buildApp()).get("/api/vehicles/search");

    expect(response.status).toBe(401);
  });
});
