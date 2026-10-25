import type { VehicleSearch } from "@/api/vehicle-contracts";

export type FilterKey = "q" | "make" | "model" | "category" | "price";

export type FilterChip = { key: FilterKey; label: string };

export function readFilters(_params: URLSearchParams): VehicleSearch {
  throw new Error("not implemented");
}

export function filterChips(_filters: VehicleSearch): FilterChip[] {
  throw new Error("not implemented");
}

export function removeFilter(_params: URLSearchParams, _key: FilterKey): URLSearchParams {
  throw new Error("not implemented");
}
