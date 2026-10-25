import {
  type CreateVehicleRequest,
  createVehicleRequestSchema,
  VEHICLE_CATEGORIES,
  type Vehicle,
} from "@dealership/shared";
import { z } from "zod";

const PRICE_MESSAGE = "Enter a price in whole rupees";
const QUANTITY_MESSAGE = "Enter a whole number, 0 or more";
const IMAGE_URL_MESSAGE = "Use an https:// image URL";

// int32, the column type; messages name the limit instead of the rule.
const wholeNumber = (message: string, tooHigh: string) =>
  z.int32({ error: (issue) => (issue.code === "too_big" ? tooHigh : message) });

// The add and edit fields. Inputs hold strings, so each field coerces
// and words its own errors; an empty image URL becomes undefined, so it
// is left out rather than sent as "".
const vehicleFields = z.object({
  make: z.string().trim().min(1, "Enter a make"),
  model: z.string().trim().min(1, "Enter a model"),
  // The select starts empty, so "" is a valid input that fails here.
  category: z
    .literal("")
    .or(z.enum(VEHICLE_CATEGORIES))
    .pipe(z.enum(VEHICLE_CATEGORIES, { error: "Choose a category" })),
  price: z.coerce
    .number({ error: PRICE_MESSAGE })
    .pipe(wholeNumber(PRICE_MESSAGE, "Price is too high").positive({ error: PRICE_MESSAGE })),
  quantity: z.coerce
    .number({ error: QUANTITY_MESSAGE })
    .pipe(
      wholeNumber(QUANTITY_MESSAGE, "Quantity is too high").min(0, { error: QUANTITY_MESSAGE }),
    ),
  imageUrl: z
    .literal("")
    .transform(() => undefined)
    .or(z.url({ protocol: /^https$/, error: IMAGE_URL_MESSAGE }))
    .optional(),
});

// Both forms pipe through the shared create schema, so the output is
// exactly the API's payload.
export const vehicleFormSchema = vehicleFields.pipe(createVehicleRequestSchema);

// Editing a vehicle that has an image: it can be replaced, never removed,
// so the form never needs to send imageUrl null.
export const keepImageFormSchema = vehicleFields
  .refine((values) => values.imageUrl !== undefined, {
    path: ["imageUrl"],
    message: "An image can be replaced but not removed",
  })
  .pipe(createVehicleRequestSchema);

export type VehicleFormValues = z.input<typeof vehicleFormSchema>;

export type VehicleFormOutput = CreateVehicleRequest;

export const emptyVehicleForm: VehicleFormValues = {
  make: "",
  model: "",
  category: "",
  price: "",
  quantity: "0",
  imageUrl: "",
};

export function toVehicleForm(vehicle: Vehicle): VehicleFormValues {
  return {
    make: vehicle.make,
    model: vehicle.model,
    category: vehicle.category,
    price: String(vehicle.price),
    quantity: String(vehicle.quantity),
    imageUrl: vehicle.imageUrl ?? "",
  };
}

export const vehicleFormFields = [
  "make",
  "model",
  "category",
  "price",
  "quantity",
  "imageUrl",
] as const;
