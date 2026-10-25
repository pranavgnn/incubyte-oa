import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleSearchQuery,
} from "@dealership/shared";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { Database } from "../db/client.js";
import { vehicles } from "../db/schema.js";
import type { VehicleRepository } from "../services/vehicle-service.js";

type VehicleRow = typeof vehicles.$inferSelect;

export class DrizzleVehicleRepository implements VehicleRepository {
  constructor(private readonly db: Database) {}

  async search(filters: VehicleSearchQuery): Promise<Vehicle[]> {
    const rows = await this.db
      .select()
      .from(vehicles)
      .where(
        // and() skips undefined entries, so absent filters drop out.
        and(
          filters.q === undefined
            ? undefined
            : or(contains(vehicles.make, filters.q), contains(vehicles.model, filters.q)),
          filters.make === undefined ? undefined : contains(vehicles.make, filters.make),
          filters.model === undefined ? undefined : contains(vehicles.model, filters.model),
          filters.category === undefined ? undefined : eq(vehicles.category, filters.category),
          filters.minPrice === undefined ? undefined : gte(vehicles.price, filters.minPrice),
          filters.maxPrice === undefined ? undefined : lte(vehicles.price, filters.maxPrice),
        ),
      )
      // id breaks ties so rows created in the same instant keep a stable order.
      .orderBy(desc(vehicles.createdAt), desc(vehicles.id));
    return rows.map(toVehicle);
  }

  async create(vehicle: CreateVehicleRequest): Promise<Vehicle> {
    const [row] = await this.db.insert(vehicles).values(vehicle).returning();
    return toVehicle(row as VehicleRow);
  }

  async update(id: string, changes: UpdateVehicleRequest): Promise<Vehicle> {
    const [row] = await this.db
      .update(vehicles)
      .set({ ...changes, updatedAt: sql`now()` })
      .where(eq(vehicles.id, id))
      .returning();
    return toVehicle(row as VehicleRow);
  }
}

// Case-insensitive substring match. User input is escaped so %, _ and \
// match themselves instead of acting as LIKE wildcards.
function contains(column: PgColumn, text: string) {
  return ilike(column, `%${text.replace(/[\\%_]/g, "\\$&")}%`);
}

function toVehicle(row: VehicleRow): Vehicle {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
