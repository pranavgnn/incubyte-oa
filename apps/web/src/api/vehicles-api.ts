import type { ApiClient } from "./client";
import type { Vehicle, VehicleSearch } from "./vehicle-contracts";

export function createVehiclesApi(_client: ApiClient) {
  return {
    list(): Promise<Vehicle[]> {
      throw new Error("not implemented");
    },

    search(_filters: VehicleSearch): Promise<Vehicle[]> {
      throw new Error("not implemented");
    },
  };
}

export type VehiclesApi = ReturnType<typeof createVehiclesApi>;
