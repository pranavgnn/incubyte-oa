import type { CreateVehicleRequest, Vehicle } from "@dealership/shared";
import { desc } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { vehicles } from "../db/schema.js";
import type { VehicleRepository } from "../services/vehicle-service.js";

type VehicleRow = typeof vehicles.$inferSelect;

export class DrizzleVehicleRepository implements VehicleRepository {
  constructor(private readonly db: Database) {}

  async findAll(): Promise<Vehicle[]> {
    const rows = await this.db
      .select()
      .from(vehicles)
      // id breaks ties so rows created in the same instant keep a stable order.
      .orderBy(desc(vehicles.createdAt), desc(vehicles.id));
    return rows.map(toVehicle);
  }

  async create(vehicle: CreateVehicleRequest): Promise<Vehicle> {
    const [row] = await this.db.insert(vehicles).values(vehicle).returning();
    return toVehicle(row as VehicleRow);
  }
}

function toVehicle(row: VehicleRow): Vehicle {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
