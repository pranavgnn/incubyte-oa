import { afterAll, beforeEach } from "vitest";
import { testDatabase, truncateAllTables } from "./db.js";

beforeEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await testDatabase.pool.end();
});
