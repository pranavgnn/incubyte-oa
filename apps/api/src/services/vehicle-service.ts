import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleSearchQuery,
} from "@dealership/shared";
import { NotFoundError } from "../errors/app-error.js";

export interface VehicleRepository {
  // Newest first; every given filter must match, so {} returns everything.
  search(filters: VehicleSearchQuery): Promise<Vehicle[]>;
  create(vehicle: CreateVehicleRequest): Promise<Vehicle>;
  // undefined when no vehicle has the id.
  update(id: string, changes: UpdateVehicleRequest): Promise<Vehicle | undefined>;
  // false when no vehicle has the id.
  delete(id: string): Promise<boolean>;
}

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  list(): Promise<Vehicle[]> {
    return this.vehicles.search({});
  }

  search(filters: VehicleSearchQuery): Promise<Vehicle[]> {
    return this.vehicles.search(filters);
  }

  create(input: CreateVehicleRequest): Promise<Vehicle> {
    return this.vehicles.create(input);
  }

  async update(id: string, changes: UpdateVehicleRequest): Promise<Vehicle> {
    const vehicle = await this.vehicles.update(id, changes);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    return vehicle;
  }

  async delete(id: string): Promise<void> {
    await this.vehicles.delete(id);
  }
}
