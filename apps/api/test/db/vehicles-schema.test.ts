import { describe, expect, it } from "vitest";
import { testDatabase } from "../db.js";
import { insertVehicle } from "../helpers/vehicles.js";

// Postgres error code for check_violation.
const CHECK_VIOLATION = "23514";

// The API never writes a negative quantity, but the database is the last
// line of defence if a future query gets the arithmetic wrong.
describe("vehicles table", () => {
  it.each([
    {
      label: "an insert",
      write: () =>
        testDatabase.pool.query(
          "INSERT INTO vehicles (make, model, category, price, quantity) VALUES ('Ford', 'Ka', 'hatchback', 9000, -1)",
        ),
    },
    {
      label: "an update",
      write: async () => {
        const vehicle = await insertVehicle({ quantity: 1 });
        return testDatabase.pool.query(
          "UPDATE vehicles SET quantity = quantity - 2 WHERE id = $1",
          [vehicle.id],
        );
      },
    },
  ])("rejects a negative quantity from $label with a check violation", async ({ write }) => {
    await expect(write()).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });
});
