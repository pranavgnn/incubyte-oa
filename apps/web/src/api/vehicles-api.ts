import {
  type CreateVehicleRequest,
  type UpdateVehicleRequest,
  type Vehicle,
  type VehicleSearchQuery,
  vehicleSchema,
} from "@dealership/shared";
import { z } from "zod";
import type { ApiClient } from "./client";

export function createVehiclesApi(client: ApiClient) {
  return {
    list(): Promise<Vehicle[]> {
      return client.request("/api/vehicles", { schema: vehicleListSchema });
    },

    search(filters: VehicleSearchQuery): Promise<Vehicle[]> {
      return client.request(`/api/vehicles/search?${toQuery(filters)}`, {
        schema: vehicleListSchema,
      });
    },

    async purchase(id: string): Promise<void> {
      await client.request(`${vehiclePath(id)}/purchase`, { method: "POST", schema: ignored });
    },

    async create(input: CreateVehicleRequest): Promise<void> {
      await client.request("/api/vehicles", { method: "POST", body: input, schema: ignored });
    },

    // Picks the fields explicitly: callers may hold a whole vehicle or
    // form output, and the API answers 400 to quantity or unknown keys.
    async update(id: string, { make, model, category, price, imageUrl }: UpdateVehicleRequest) {
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
// are not relied on.
const ignored = z.unknown();

const vehicleListSchema = z.array(vehicleSchema);

function vehiclePath(id: string): string {
  return `/api/vehicles/${encodeURIComponent(id)}`;
}

// Empty strings and missing keys are left out; the API treats a present
// but empty param as a filter value.
function toQuery(filters: VehicleSearchQuery): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query;
}
