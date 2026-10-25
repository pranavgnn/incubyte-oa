import { z } from "zod";
import { categoryLabels, categorySchema, type VehicleSearch } from "@/api/vehicle-contracts";
import { formatPrice } from "@/lib/format";

export type FilterKey = "q" | "make" | "model" | "category" | "price";

export type FilterChip = { key: FilterKey; label: string };

const text = z.string().trim().min(1);
const price = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER));

// Each param is checked on its own so one bad value (a stale category, a
// hand-typed price) drops only itself, not the whole filter set.
const paramSchemas = {
  q: text,
  make: text,
  model: text,
  category: categorySchema,
  minPrice: price,
  maxPrice: price,
} satisfies Record<keyof VehicleSearch, z.ZodType>;

export function readFilters(params: URLSearchParams): VehicleSearch {
  const filters: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(paramSchemas)) {
    const parsed = schema.safeParse(params.get(key));
    if (parsed.success) filters[key] = parsed.data;
  }
  // A model only narrows a make; on its own it is a leftover from a
  // removed make.
  if (!filters.make) delete filters.model;
  return filters as VehicleSearch;
}

export function hasActiveFilters(filters: VehicleSearch): boolean {
  return Object.keys(filters).length > 0;
}

export function filterChips(filters: VehicleSearch): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.make) chips.push({ key: "make", label: filters.make });
  if (filters.model) chips.push({ key: "model", label: filters.model });
  if (filters.category) chips.push({ key: "category", label: categoryLabels[filters.category] });
  const priceLabel = priceRangeLabel(filters);
  if (priceLabel) chips.push({ key: "price", label: priceLabel });
  return chips;
}

function priceRangeLabel({ minPrice, maxPrice }: VehicleSearch): string | null {
  if (minPrice !== undefined && maxPrice !== undefined) {
    return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
  }
  if (minPrice !== undefined) return `From ${formatPrice(minPrice)}`;
  if (maxPrice !== undefined) return `Up to ${formatPrice(maxPrice)}`;
  return null;
}

const paramsOf: Record<FilterKey, string[]> = {
  q: ["q"],
  make: ["make", "model"],
  model: ["model"],
  category: ["category"],
  price: ["minPrice", "maxPrice"],
};

// Returns a copy without the params behind one chip.
export function removeFilter(params: URLSearchParams, key: FilterKey): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const name of paramsOf[key]) next.delete(name);
  return next;
}
