import { z } from "zod";
import { categories, type Vehicle, type VehicleInput } from "@/api/vehicle-contracts";

const PRICE_MESSAGE = "Enter a price in whole rupees";
const QUANTITY_MESSAGE = "Enter a whole number, 0 or more";
const IMAGE_URL_MESSAGE = "Use an https:// image URL";

// The add and edit forms. Inputs hold strings, so numbers are coerced;
// the output is exactly the API's editable payload, with an empty image
// URL left out rather than sent as "".
export const vehicleFormSchema = z.object({
  make: z.string().trim().min(1, "Enter a make"),
  model: z.string().trim().min(1, "Enter a model"),
  // The select starts empty, so "" is a valid input that fails here.
  category: z
    .literal("")
    .or(z.enum(categories))
    .pipe(z.enum(categories, { error: "Choose a category" })),
  price: z.coerce
    .number({ error: PRICE_MESSAGE })
    .int({ error: PRICE_MESSAGE })
    .positive({ error: PRICE_MESSAGE }),
  quantity: z.coerce
    .number({ error: QUANTITY_MESSAGE })
    .int({ error: QUANTITY_MESSAGE })
    .min(0, { error: QUANTITY_MESSAGE }),
  imageUrl: z
    .literal("")
    .transform(() => undefined)
    .or(z.url({ protocol: /^https$/, error: IMAGE_URL_MESSAGE })),
});

export type VehicleFormValues = z.input<typeof vehicleFormSchema>;

export type VehicleFormOutput = z.output<typeof vehicleFormSchema> & VehicleInput;

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
