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

// Trimmed first, so a name of only spaces counts as empty.
const vehicleNameSchema = z.string().trim().min(1);

// Postgres integer columns are int32; bounding here keeps an oversized
// number a 400 instead of a database error.
const priceSchema = z.int32().positive();

const imageUrlSchema = z.url({ protocol: /^https$/ });

export const createVehicleRequestSchema = z.strictObject({
  make: vehicleNameSchema,
  model: vehicleNameSchema,
  category: vehicleCategorySchema,
  price: priceSchema,
  quantity: z.int32().nonnegative(),
  imageUrl: imageUrlSchema.optional(),
});

export type CreateVehicleRequest = z.infer<typeof createVehicleRequestSchema>;

export const vehicleSearchQuerySchema = z.strictObject({
  q: z.string().optional(),
});

export type VehicleSearchQuery = z.infer<typeof vehicleSearchQuerySchema>;
