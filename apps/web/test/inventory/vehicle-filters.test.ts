import { describe, expect, it } from "vitest";
import type { VehicleSearch } from "@/api/vehicle-contracts";
import {
  type FilterKey,
  filterChips,
  readFilters,
  removeFilter,
} from "@/inventory/vehicle-filters";

describe("readFilters", () => {
  it.each<[string, string, VehicleSearch]>([
    ["no params", "", {}],
    [
      "every filter",
      "q=nex&make=Tata&model=Nexon&category=suv&minPrice=100000&maxPrice=900000",
      {
        q: "nex",
        make: "Tata",
        model: "Nexon",
        category: "suv",
        minPrice: 100000,
        maxPrice: 900000,
      },
    ],
    ["blank values", "q=%20%20&make=&category=", {}],
    ["a trimmed query", "q=%20nex%20", { q: "nex" }],
    ["an unknown category", "category=spaceship", {}],
    ["a model without a make", "model=Nexon", {}],
    ["non-integer or negative prices", "minPrice=abc&maxPrice=-5", {}],
    ["decimal prices", "minPrice=10.5", {}],
    ["a zero minimum price", "minPrice=0", { minPrice: 0 }],
    ["unrelated params", "page=2&sort=price", {}],
  ])("reads %s", (_label, search, expected) => {
    expect(readFilters(new URLSearchParams(search))).toEqual(expected);
  });
});

describe("filterChips", () => {
  it.each<[string, VehicleSearch, string[]]>([
    ["no filters", {}, []],
    [
      "text, make, model and category",
      { q: "nex", make: "Tata", model: "Nexon", category: "suv" },
      ["“nex”", "Tata", "Nexon", "SUV"],
    ],
    ["a full price range", { minPrice: 100000, maxPrice: 900000 }, ["₹1,00,000 – ₹9,00,000"]],
    ["a minimum price only", { minPrice: 100000 }, ["From ₹1,00,000"]],
    ["a maximum price only", { maxPrice: 900000 }, ["Up to ₹9,00,000"]],
  ])("labels %s", (_label, filters, labels) => {
    expect(filterChips(filters).map((chip) => chip.label)).toEqual(labels);
  });
});

describe("removeFilter", () => {
  it.each<[FilterKey, string, string]>([
    ["q", "q=nex&make=Tata", "make=Tata"],
    ["category", "category=suv&q=nex", "q=nex"],
    ["model", "make=Tata&model=Nexon", "make=Tata"],
    ["make", "make=Tata&model=Nexon&q=nex", "q=nex"],
    ["price", "minPrice=1&maxPrice=9&q=nex", "q=nex"],
  ])("removing %s drops its params and the ones that depend on it", (key, before, after) => {
    const chip = filterChips(readFilters(new URLSearchParams(before))).find((c) => c.key === key);
    expect(chip).toBeDefined();

    expect(removeFilter(new URLSearchParams(before), key).toString()).toBe(after);
  });
});
