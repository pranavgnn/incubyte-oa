import { VEHICLE_CATEGORIES } from "@dealership/shared";
import { describe, expect, it } from "vitest";
import { vehicles } from "../../src/db/schema.js";
import { seedVehicles } from "../../src/db/seed-vehicles.js";
import { testDatabase } from "../db.js";
import { insertVehicle } from "../helpers/vehicles.js";

function allVehicles() {
  return testDatabase.db.select().from(vehicles);
}

describe("seedVehicles", () => {
  it("fills an empty table with a sample catalogue covering every category and stock level", async () => {
    const inserted = await seedVehicles(testDatabase.db);

    const rows = await allVehicles();
    expect(inserted).toBe(rows.length);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(new Set(rows.map(({ category }) => category))).toEqual(new Set(VEHICLE_CATEGORIES));
    const quantities = rows.map(({ quantity }) => quantity);
    expect(quantities).toContain(0);
    expect(quantities.some((quantity) => quantity >= 1 && quantity <= 3)).toBe(true);
    for (const { imageUrl } of rows) {
      if (imageUrl !== null) expect(imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
    }
  });

  it("inserts nothing when any vehicle already exists", async () => {
    const existing = await insertVehicle();

    const inserted = await seedVehicles(testDatabase.db);

    expect(inserted).toBe(0);
    expect(await allVehicles()).toEqual([existing]);
  });

  it("is safe to run twice: the second run inserts nothing", async () => {
    const first = await seedVehicles(testDatabase.db);

    const second = await seedVehicles(testDatabase.db);

    expect(second).toBe(0);
    expect(await allVehicles()).toHaveLength(first);
  });
});
