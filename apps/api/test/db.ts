import { inject } from "vitest";
import { createDb } from "../src/db/client.js";
import { truncateAllTables } from "./truncate.js";

// One pool per test worker, pointed at the URL that globalSetup verified.
export const testDatabase = createDb(inject("testDatabaseUrl"));

export function truncateTestDatabase(): Promise<void> {
  return truncateAllTables(testDatabase.pool);
}
