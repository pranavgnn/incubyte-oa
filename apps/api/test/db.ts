import { inject } from "vitest";
import { createDb } from "../src/db/client.js";

// One pool per test worker, pointed at the URL that globalSetup verified.
export const testDatabase = createDb(inject("testDatabaseUrl"));

export async function truncateAllTables(): Promise<void> {
  const { rows } = await testDatabase.pool.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  if (rows.length === 0) return;
  const tables = rows.map(({ tablename }) => `"public"."${tablename}"`).join(", ");
  await testDatabase.pool.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
