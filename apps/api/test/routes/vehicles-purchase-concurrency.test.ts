import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { vehicles } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp } from "../helpers/build-app.js";
import { bearer } from "../helpers/tokens.js";
import { insertVehicle } from "../helpers/vehicles.js";

describe("POST /api/vehicles/:id/purchase under concurrency", () => {
  it("sells exactly the stock when more buyers than units race for it", async () => {
    const stock = 3;
    const buyers = 12;
    const vehicle = await insertVehicle({ quantity: stock });
    const app = buildApp();
    const authorization = await bearer("user");

    // All requests are in flight before any is awaited, so they hit
    // Postgres concurrently on separate pooled connections.
    const responses = await Promise.all(
      Array.from({ length: buyers }, () =>
        request(app)
          .post(`/api/vehicles/${vehicle.id}/purchase`)
          .set("Authorization", authorization),
      ),
    );

    const statuses = responses.map(({ status }) => status);
    expect(statuses.filter((status) => status === 200)).toHaveLength(stock);
    expect(statuses.filter((status) => status === 409)).toHaveLength(buyers - stock);
    const [stored] = await testDatabase.db
      .select({ quantity: vehicles.quantity })
      .from(vehicles)
      .where(eq(vehicles.id, vehicle.id));
    expect(stored?.quantity).toBe(0);
  });
});
