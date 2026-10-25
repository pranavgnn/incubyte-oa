import { useEffect, useId, useState } from "react";
import { z } from "zod";
import type { Vehicle, VehicleSearch } from "@/api/vehicle-contracts";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatPrice } from "@/lib/format";
import type { ParamChanges } from "./filter-bar";

const wholeRupees = z
  .string()
  .trim()
  .regex(/^\d*$/, "Use whole rupees")
  .transform((value) => (value === "" ? undefined : Number(value)));

const priceRangeSchema = z
  .object({ min: wholeRupees, max: wholeRupees })
  .refine(({ min, max }) => min === undefined || max === undefined || min <= max, {
    message: "Min must not be above max",
    path: ["min"],
  });

type PriceFilterProps = {
  filters: VehicleSearch;
  vehicles: Vehicle[];
  disabled: boolean;
  onChange: (changes: ParamChanges, replace: boolean) => void;
};

// Two whole-number inputs in a popover. Empty means no bound; the
// placeholders show the cheapest and dearest vehicle in the inventory.
export function PriceFilter({ filters, vehicles, disabled, onChange }: PriceFilterProps) {
  const id = useId();
  const [min, setMin] = useState(String(filters.minPrice ?? ""));
  const [max, setMax] = useState(String(filters.maxPrice ?? ""));

  // The URL can change without typing (chip, Reset, Back).
  useEffect(() => setMin(String(filters.minPrice ?? "")), [filters.minPrice]);
  useEffect(() => setMax(String(filters.maxPrice ?? "")), [filters.maxPrice]);

  const parsed = priceRangeSchema.safeParse({ min, max });
  const minPrice = parsed.success ? parsed.data.min : filters.minPrice;
  const maxPrice = parsed.success ? parsed.data.max : filters.maxPrice;

  // An invalid draft keeps the URL as it is until it is fixed.
  useEffect(() => {
    if (minPrice === filters.minPrice && maxPrice === filters.maxPrice) return;
    const timer = setTimeout(
      () => onChange({ minPrice: toParam(minPrice), maxPrice: toParam(maxPrice) }, true),
      300,
    );
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice, filters.minPrice, filters.maxPrice, onChange]);

  const prices = vehicles.map((vehicle) => vehicle.price);
  const lowest = prices.length > 0 ? Math.min(...prices) : undefined;
  const highest = prices.length > 0 ? Math.max(...prices) : undefined;
  const errors = parsed.success ? [] : parsed.error.issues;

  return (
    <div className="flex flex-col gap-1 md:w-52">
      <Label
        htmlFor={id}
        className="px-3 text-overline font-semibold text-muted-foreground uppercase"
      >
        Price
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="ghost"
            type="button"
            disabled={disabled}
            className="justify-start font-mono tabular-nums"
          >
            {triggerLabel(filters, lowest, highest)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="grid w-72 grid-cols-2 gap-3">
          <Field data-invalid={errors.some((issue) => issue.path[0] === "min")}>
            <FieldLabel htmlFor={`${id}-min`}>Min price</FieldLabel>
            <Input
              id={`${id}-min`}
              inputMode="numeric"
              placeholder={lowest === undefined ? "0" : String(lowest)}
              value={min}
              onChange={(event) => setMin(event.target.value)}
            />
          </Field>
          <Field data-invalid={errors.some((issue) => issue.path[0] === "max")}>
            <FieldLabel htmlFor={`${id}-max`}>Max price</FieldLabel>
            <Input
              id={`${id}-max`}
              inputMode="numeric"
              placeholder={highest === undefined ? "" : String(highest)}
              value={max}
              onChange={(event) => setMax(event.target.value)}
            />
          </Field>
          <FieldError className="col-span-2" errors={errors} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function toParam(value: number | undefined): string | undefined {
  return value === undefined ? undefined : String(value);
}

function triggerLabel(
  { minPrice, maxPrice }: VehicleSearch,
  lowest: number | undefined,
  highest: number | undefined,
): string {
  const from = minPrice ?? lowest;
  const to = maxPrice ?? highest;
  if (from === undefined || to === undefined) return "Any price";
  return `${formatPrice(from)} – ${formatPrice(to)}`;
}
