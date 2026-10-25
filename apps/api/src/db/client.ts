import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  // pg removes the broken idle client itself; without a listener the
  // emitted error would be uncaught and crash the process.
  pool.on("error", (error) => {
    console.error("Idle database client error:", error.message);
  });
  return { db: drizzle({ client: pool, schema }), pool };
}

export type Database = ReturnType<typeof createDb>["db"];
