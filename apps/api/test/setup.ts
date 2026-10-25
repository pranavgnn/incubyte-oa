import { afterAll, beforeEach } from "vitest";
import { testDatabase, truncateTestDatabase } from "./db.js";

beforeEach(async () => {
  await truncateTestDatabase();
});

afterAll(async () => {
  await testDatabase.pool.end();
});
