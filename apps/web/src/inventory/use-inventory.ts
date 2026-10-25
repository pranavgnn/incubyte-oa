import type { Vehicle, VehicleSearchQuery } from "@dealership/shared";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/api/api-provider";
import { hasActiveFilters } from "./vehicle-filters";

type Request<T> = { data: T | null; error: unknown; loading: boolean };

const idle = { data: null, error: null, loading: true };

// The full list always loads: it feeds the header count and the make and
// model options. Search runs on top of it only while a filter is active.
export function useInventory(filters: VehicleSearchQuery) {
  const { vehiclesApi } = useApi();
  const [version, setVersion] = useState(0);
  const [all, setAll] = useState<Request<Vehicle[]>>(idle);
  const [found, setFound] = useState<Request<Vehicle[]>>(idle);
  const searching = hasActiveFilters(filters);
  // Effects compare dependencies by identity; the serialised filters
  // only change when a filter value does.
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    void version;
    return track(vehiclesApi.list(), setAll);
  }, [vehiclesApi, version]);

  useEffect(() => {
    void version;
    if (!searching) return;
    return track(vehiclesApi.search(JSON.parse(filterKey)), setFound);
  }, [vehiclesApi, filterKey, searching, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  // Local stock change ahead of (or instead of) a refetch, applied to
  // both the full list and the search results.
  const setQuantity = useCallback((id: string, quantity: (current: number) => number) => {
    const patch = (prev: Request<Vehicle[]>) => ({
      ...prev,
      data:
        prev.data?.map((vehicle) =>
          vehicle.id === id ? { ...vehicle, quantity: quantity(vehicle.quantity) } : vehicle,
        ) ?? null,
    });
    setAll(patch);
    setFound(patch);
  }, []);

  const shown = searching ? found : all;
  return {
    all: all.data,
    results: shown.data,
    error: all.error ?? shown.error,
    loading: all.loading || shown.loading,
    refetch,
    setQuantity,
  };
}

// Runs one request into a state slot, keeping the previous data visible
// while it is in flight. The returned cleanup drops a stale response.
function track<T>(promise: Promise<T>, set: (update: (prev: Request<T>) => Request<T>) => void) {
  let current = true;
  set((prev) => ({ ...prev, loading: true }));
  promise.then(
    (data) => current && set(() => ({ data, error: null, loading: false })),
    (error: unknown) => current && set((prev) => ({ ...prev, error, loading: false })),
  );
  return () => {
    current = false;
  };
}
