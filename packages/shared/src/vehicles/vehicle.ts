import { z } from "zod";

// A plain tuple as well as a schema, so the database enum is built from
// the same list.
export const VEHICLE_CATEGORIES = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "convertible",
  "truck",
  "van",
  "electric",
] as const;

export const vehicleCategorySchema = z.enum(VEHICLE_CATEGORIES);

export type VehicleCategory = z.infer<typeof vehicleCategorySchema>;
