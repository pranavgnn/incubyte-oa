import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { FilterBar } from "@/inventory/filter-bar";
import {
  InventoryError,
  InventorySkeleton,
  NoInventory,
  NoMatches,
} from "@/inventory/inventory-states";
import { useInventory } from "@/inventory/use-inventory";
import { VehicleCard } from "@/inventory/vehicle-card";
import { hasActiveFilters, readFilters } from "@/inventory/vehicle-filters";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const inventory = useInventory(filters);
  const all = inventory.all ?? [];
  const inStock = all.filter((vehicle) => vehicle.quantity > 0).length;
  const clearFilters = () => setSearchParams({});
  const refetching = inventory.loading && inventory.results !== null;

  return (
    <>
      <section className="bg-hero pt-10 pb-20 text-hero-foreground">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-4 sm:px-6 lg:px-8">
          <p className="text-overline font-semibold uppercase">Inventory</p>
          <h1 className="font-display text-h1 font-bold sm:text-display">Find your next drive</h1>
          {inventory.all && (
            <p className="font-mono text-hero-foreground/70">
              {all.length} vehicles · {inStock} in stock
            </p>
          )}
        </div>
      </section>
      <div className="mx-auto -mt-10 flex max-w-page flex-col gap-8 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <FilterBar filters={filters} vehicles={inventory.all} />
          <div className="h-0.5 overflow-hidden rounded-full">
            {refetching && <div className="h-full w-1/3 bg-brand motion-safe:animate-pulse" />}
          </div>
          <p aria-live="polite" className="sr-only">
            {inventory.results && `${inventory.results.length} results`}
          </p>
        </div>
        <InventoryGrid
          inventory={inventory}
          filtered={hasActiveFilters(filters)}
          onClearFilters={clearFilters}
        />
      </div>
    </>
  );
}

function InventoryGrid({
  inventory,
  filtered,
  onClearFilters,
}: {
  inventory: ReturnType<typeof useInventory>;
  filtered: boolean;
  onClearFilters: () => void;
}) {
  const { results, error, loading, refetch } = inventory;
  if (error) return <InventoryError error={error} onRetry={refetch} />;
  if (!results) return <InventorySkeleton />;
  if (results.length === 0) {
    return filtered ? <NoMatches onClear={onClearFilters} /> : <NoInventory />;
  }
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 motion-safe:transition-opacity",
        loading && "opacity-60",
      )}
    >
      {results.map((vehicle) => (
        <li key={vehicle.id} aria-label={`${vehicle.make} ${vehicle.model}`}>
          <VehicleCard vehicle={vehicle} />
        </li>
      ))}
    </ul>
  );
}
