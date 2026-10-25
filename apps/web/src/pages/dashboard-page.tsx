import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useInventory } from "@/inventory/use-inventory";
import { VehicleCard } from "@/inventory/vehicle-card";
import { readFilters } from "@/inventory/vehicle-filters";

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const inventory = useInventory(filters);
  const all = inventory.all ?? [];
  const inStock = all.filter((vehicle) => vehicle.quantity > 0).length;

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
      <div className="mx-auto mt-8 max-w-page px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {inventory.results?.map((vehicle) => (
            <li key={vehicle.id} aria-label={`${vehicle.make} ${vehicle.model}`}>
              <VehicleCard vehicle={vehicle} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
