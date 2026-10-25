// TEMPORARY: local mirror of the vehicle contract in DESIGN.md section 0.
// The API has not added vehicle endpoints to @dealership/shared yet;
// delete this file and import from there once it does.
import { z } from "zod";

export const categories = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "convertible",
  "truck",
  "van",
  "electric",
] as const;

export const categorySchema = z.enum(categories);

export type Category = z.infer<typeof categorySchema>;

export const categoryLabels: Record<Category, string> = {
  sedan: "Sedan",
  suv: "SUV",
  hatchback: "Hatchback",
  coupe: "Coupe",
  convertible: "Convertible",
  truck: "Truck",
  van: "Van",
  electric: "Electric",
};

export const vehicleSchema = z.strictObject({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  category: categorySchema,
  price: z.number().int().positive(),
  quantity: z.number().int().min(0),
  imageUrl: z.url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export const vehicleListSchema = z.array(vehicleSchema);

// POST /api/vehicles and PUT /api/vehicles/:id: the editable fields only,
// never id or timestamps.
export type VehicleInput = Pick<Vehicle, "make" | "model" | "category" | "price" | "quantity"> & {
  imageUrl?: string;
};

// PUT /api/vehicles/:id rejects quantity: stock only changes through
// purchase and restock.
export type VehicleUpdate = Omit<VehicleInput, "quantity">;

// GET /api/vehicles/search. Every key is optional and empty ones are
// never sent.
export type VehicleSearch = {
  q?: string;
  make?: string;
  model?: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
};
