import type { Vehicle } from "@dealership/shared";

export interface VehicleRepository {
  // Newest first.
  findAll(): Promise<Vehicle[]>;
}

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }
}
