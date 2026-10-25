import { z } from "zod";
import type { ApiClient } from "./client";
import {
  type Vehicle,
  type VehicleInput,
  type VehicleSearch,
  type VehicleUpdate,
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

    async purchase(id: string): Promise<void> {
      await client.request(`${vehiclePath(id)}/purchase`, { method: "POST", schema: ignored });
    },

    async create(input: VehicleInput): Promise<void> {
      await client.request("/api/vehicles", { method: "POST", body: input, schema: ignored });
    },

    // Picks the fields explicitly: callers may hold a whole vehicle or
    // form output, and the API answers 400 to quantity or unknown keys.
    async update(id: string, { make, model, category, price, imageUrl }: VehicleUpdate) {
      const body = { make, model, category, price, imageUrl };
      await client.request(vehiclePath(id), { method: "PUT", body, schema: ignored });
    },

    async restock(id: string, quantity: number): Promise<void> {
      await client.request(`${vehiclePath(id)}/restock`, {
        method: "POST",
        body: { quantity },
        schema: ignored,
      });
    },

    async remove(id: string): Promise<void> {
      await client.request(vehiclePath(id), { method: "DELETE", schema: ignored });
    },
  };
}

export type VehiclesApi = ReturnType<typeof createVehiclesApi>;

// Writes are followed by a refetch of the list, so their response bodies
// are not relied on (DESIGN.md section 0 does not define them).
const ignored = z.unknown();

function vehiclePath(id: string): string {
  return `/api/vehicles/${encodeURIComponent(id)}`;
}

// Empty strings and missing keys are left out; the API treats a present
// but empty param as a filter value.
function toQuery(filters: VehicleSearch): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query;
}
