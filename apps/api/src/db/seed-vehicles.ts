import type { CreateVehicleRequest } from "@dealership/shared";
import type { Database } from "./client.js";
import { vehicles } from "./schema.js";

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
}

// Every image URL here was checked to load before it was added.
// Categories without a verified photo have no image.
export const SAMPLE_VEHICLES: CreateVehicleRequest[] = [
  {
    make: "Ford",
    model: "Mustang GT",
    category: "coupe",
    price: 42000,
    quantity: 3,
    imageUrl: unsplash("1494976388531-d1058494cdd8"),
  },
  {
    make: "Chevrolet",
    model: "Camaro SS",
    category: "coupe",
    price: 39000,
    quantity: 0,
    imageUrl: unsplash("1552519507-da3b142c6e3d"),
  },
  {
    make: "Fiat",
    model: "500",
    category: "hatchback",
    price: 17000,
    quantity: 4,
    imageUrl: unsplash("1549317661-bd32c8ce0db2"),
  },
  {
    make: "Ford",
    model: "Expedition",
    category: "suv",
    price: 56000,
    quantity: 2,
    imageUrl: unsplash("1533473359331-0135ef1b58bf"),
  },
  {
    make: "Land Rover",
    model: "Range Rover Sport",
    category: "suv",
    price: 84000,
    quantity: 0,
    imageUrl: unsplash("1563720223185-11003d516935"),
  },
  {
    make: "Tesla",
    model: "Model 3",
    category: "electric",
    price: 40000,
    quantity: 5,
    imageUrl: unsplash("1560958089-b8a1929cea89"),
  },
  {
    make: "Tesla",
    model: "Model S",
    category: "electric",
    price: 75000,
    quantity: 0,
    imageUrl: unsplash("1536700503339-1e4b06520771"),
  },
  {
    make: "BMW",
    model: "M5",
    category: "sedan",
    price: 105000,
    quantity: 1,
    imageUrl: unsplash("1555215695-3004980ad54e"),
  },
  {
    make: "Toyota",
    model: "Camry",
    category: "sedan",
    price: 28000,
    quantity: 6,
    imageUrl: unsplash("1621007947382-bb3c3994e3fb"),
  },
  { make: "Ford", model: "F-150", category: "truck", price: 48000, quantity: 2 },
  { make: "Mercedes-Benz", model: "Sprinter", category: "van", price: 52000, quantity: 1 },
  { make: "Mazda", model: "MX-5 Miata", category: "convertible", price: 30000, quantity: 0 },
];

// Inserts the sample catalogue only when there are no vehicles yet, so
// re-running db:seed never duplicates or overwrites real inventory.
// Returns how many vehicles were inserted.
export async function seedVehicles(db: Database): Promise<number> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: vehicles.id }).from(vehicles).limit(1);
    if (existing) return 0;
    // Staggered timestamps give the newest-first list a stable, readable order.
    const now = Date.now();
    const rows = SAMPLE_VEHICLES.map((vehicle, index) => ({
      ...vehicle,
      createdAt: new Date(now - index * 60_000),
    }));
    await tx.insert(vehicles).values(rows);
    return rows.length;
  });
}
