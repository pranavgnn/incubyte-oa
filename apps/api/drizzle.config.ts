import { defineConfig } from "drizzle-kit";

// Only used by `drizzle-kit generate`, which diffs the schema against
// the migration history and needs no database connection.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
});
