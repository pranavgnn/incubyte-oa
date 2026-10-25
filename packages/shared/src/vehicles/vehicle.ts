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

// A vehicle as the API returns it. Timestamps are ISO 8601 strings.
export const vehicleSchema = z.strictObject({
  id: z.uuid(),
  make: z.string(),
  model: z.string(),
  category: vehicleCategorySchema,
  price: z.int(),
  quantity: z.int(),
  imageUrl: z.url().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export const createVehicleRequestSchema = z.object({
  make: z.string().trim(),
  model: z.string().trim(),
  category: vehicleCategorySchema,
  price: z.number(),
  quantity: z.number(),
  imageUrl: z.string().optional(),
});

export type CreateVehicleRequest = z.infer<typeof createVehicleRequestSchema>;
