import type { Database } from "./client.js";

// Inserts the sample catalogue only when there are no vehicles yet.
// Returns how many vehicles were inserted.
export async function seedVehicles(_db: Database): Promise<number> {
  throw new Error("not implemented");
}
