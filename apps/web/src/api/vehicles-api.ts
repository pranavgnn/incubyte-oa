import type { ApiClient } from "./client";
import {
  type Vehicle,
  type VehicleInput,
  type VehicleSearch,
  vehicleListSchema,
} from "./vehicle-contracts";

export function createVehiclesApi(client: ApiClient) {
  return {
    list(): Promise<Vehicle[]> {
      return client.request("/api/vehicles", { schema: vehicleListSchema });
    },

    search(filters: VehicleSearch): Promise<Vehicle[]> {
      return client.request(`/api/vehicles/search?${toQuery(filters)}`, {
        schema: vehicleListSchema,
      });
    },

    purchase(_id: string): Promise<void> {
      throw new Error("not implemented");
    },

    create(_input: VehicleInput): Promise<void> {
      throw new Error("not implemented");
    },

    update(_id: string, _input: VehicleInput): Promise<void> {
      throw new Error("not implemented");
    },

    restock(_id: string, _quantity: number): Promise<void> {
      throw new Error("not implemented");
    },

    remove(_id: string): Promise<void> {
      throw new Error("not implemented");
    },
  };
}

export type VehiclesApi = ReturnType<typeof createVehiclesApi>;

// Empty strings and missing keys are left out; the API treats a present
// but empty param as a filter value.
function toQuery(filters: VehicleSearch): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query;
}
