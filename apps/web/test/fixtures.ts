import type { Vehicle } from "@dealership/shared";

let sequence = 0;

// A valid vehicle as the API returns it; override only what a test cares about.
export function aVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  sequence += 1;
  return {
    id: `0b6f1c2e-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    make: "Tata",
    model: "Nexon",
    category: "suv",
    price: 1_250_000,
    quantity: 5,
    imageUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
