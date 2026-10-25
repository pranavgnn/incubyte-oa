import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleSearchQuery,
} from "@dealership/shared";

export interface VehicleRepository {
  // Newest first; every given filter must match, so {} returns everything.
  search(filters: VehicleSearchQuery): Promise<Vehicle[]>;
  create(vehicle: CreateVehicleRequest): Promise<Vehicle>;
  update(id: string, changes: UpdateVehicleRequest): Promise<Vehicle>;
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

  update(id: string, changes: UpdateVehicleRequest): Promise<Vehicle> {
    return this.vehicles.update(id, changes);
  }
}
