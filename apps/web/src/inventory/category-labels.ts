import type { VehicleCategory } from "@dealership/shared";

// Display labels from DESIGN.md section 0. The API and the URL always
// use the lowercase enum values; these are for people only.
export const categoryLabels: Record<VehicleCategory, string> = {
  sedan: "Sedan",
  suv: "SUV",
  hatchback: "Hatchback",
  coupe: "Coupe",
  convertible: "Convertible",
  truck: "Truck",
  van: "Van",
  electric: "Electric",
};
