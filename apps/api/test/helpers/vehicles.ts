import { vehicles } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";

type VehicleRow = typeof vehicles.$inferInsert;

// Inserts straight into the test database, so tests can arrange any
// stock level or timestamp without going through admin endpoints.
export async function insertVehicle(overrides: Partial<VehicleRow> = {}) {
  const [row] = await testDatabase.db
    .insert(vehicles)
    .values({
      make: "Toyota",
      model: "Corolla",
      category: "sedan",
      price: 20000,
      quantity: 5,
      ...overrides,
    })
    .returning();
  if (!row) throw new Error("insert returned no row");
  return row;
}

// The JSON shape the API sends for a stored row.
export function asJson(row: typeof vehicles.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
