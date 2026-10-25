import type { CreateVehicleRequest, Vehicle } from "@dealership/shared";

export interface VehicleRepository {
  // Newest first.
  findAll(): Promise<Vehicle[]>;
  create(vehicle: CreateVehicleRequest): Promise<Vehicle>;
}

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }

  create(input: CreateVehicleRequest): Promise<Vehicle> {
    return this.vehicles.create(input);
  }
}
