import { SearchIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router";
import {
  type Category,
  categories,
  categoryLabels,
  type Vehicle,
  type VehicleSearch,
} from "@/api/vehicle-contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PriceFilter } from "./price-filter";
import { type FilterKey, filterChips, hasActiveFilters, removeFilter } from "./vehicle-filters";

// Radix Select items cannot have an empty value, so "no filter" gets a
// sentinel that never reaches the URL.
const ANY = "__any__";

export type ParamChanges = Partial<Record<keyof VehicleSearch, string | undefined>>;

type FilterBarProps = {
  filters: VehicleSearch;
  // The full inventory; makes, models and price bounds come from it.
  vehicles: Vehicle[] | null;
};

export function FilterBar({ filters, vehicles }: FilterBarProps) {
  const [, setSearchParams] = useSearchParams();
  const disabled = vehicles === null;
  const makes = distinct((vehicles ?? []).map((vehicle) => vehicle.make));
  const models = distinct(
    (vehicles ?? []).filter((vehicle) => vehicle.make === filters.make).map((v) => v.model),
  );

  // Typing (search, price) replaces the history entry so Back does not
  // step through every keystroke; discrete choices push a new one.
  const update = useCallback(
    (changes: ParamChanges, replace = false) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace },
      ),
    [setSearchParams],
  );

  const remove = (key: FilterKey) => setSearchParams((prev) => removeFilter(prev, key));
  const chips = filterChips(filters);

  return (
    <div className="flex flex-col gap-3">
      <Card className="gap-0 rounded-xl p-2 shadow-card-hover">
        {/* <search> is the search landmark DESIGN.md asks for via role="search". */}
        <search>
          <form
            onSubmit={(event) => event.preventDefault()}
            className="flex flex-col gap-2 md:flex-row md:items-end"
          >
            <SearchInput query={filters.q} onSearch={update} disabled={disabled} />
            <Separator orientation="vertical" className="hidden md:block" />
            <FilterSelect
              label="Make"
              value={filters.make}
              anyLabel="All makes"
              options={makes.map((make) => ({ value: make, label: make }))}
              disabled={disabled}
              onChange={(make) => update({ make, model: undefined })}
            />
            <Separator orientation="vertical" className="hidden md:block" />
            <FilterSelect
              label="Model"
              value={filters.model}
              anyLabel="All models"
              options={models.map((model) => ({ value: model, label: model }))}
              disabled={disabled || !filters.make}
              onChange={(model) => update({ model })}
            />
            <Separator orientation="vertical" className="hidden md:block" />
            <FilterSelect
              label="Category"
              value={filters.category}
              anyLabel="All categories"
              options={categories.map((category: Category) => ({
                value: category,
                label: categoryLabels[category],
              }))}
              disabled={disabled}
              onChange={(category) => update({ category })}
            />
            <Separator orientation="vertical" className="hidden md:block" />
            <PriceFilter
              filters={filters}
              vehicles={vehicles ?? []}
              disabled={disabled}
              onChange={update}
            />
            {hasActiveFilters(filters) && (
              <Button variant="ghost" type="button" onClick={() => setSearchParams({})}>
                Reset
              </Button>
            )}
          </form>
        </search>
      </Card>
      {chips.length > 0 && (
        <ul aria-label="Active filters" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Badge variant="secondary" className="h-7 gap-1 pr-1">
                {chip.label}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove filter: ${chip.label}`}
                  onClick={() => remove(chip.key)}
                >
                  <XIcon />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchInput({
  query = "",
  onSearch,
  disabled,
}: {
  query?: string;
  onSearch: (changes: ParamChanges, replace: boolean) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(query);

  // The URL can change without typing (chip, Reset, Back).
  useEffect(() => setText(query), [query]);

  useEffect(() => {
    const q = text.trim();
    if (q === query) return;
    const timer = setTimeout(() => onSearch({ q }, true), 300);
    return () => clearTimeout(timer);
  }, [text, query, onSearch]);

  return (
    <div className="flex flex-col gap-1 md:flex-1">
      <Label htmlFor={id} className="sr-only">
        Search
      </Label>
      <InputGroup className="border-0 shadow-none">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          type="search"
          placeholder="Search make or model"
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
        />
      </InputGroup>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  anyLabel,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value?: string;
  anyLabel: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 md:w-40">
      <Label
        htmlFor={id}
        className="px-3 text-overline font-semibold text-muted-foreground uppercase"
      >
        {label}
      </Label>
      <Select
        value={value ?? ANY}
        disabled={disabled}
        onValueChange={(next) => onChange(next === ANY ? undefined : next)}
      >
        <SelectTrigger id={id} className="w-full border-0 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function distinct(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
