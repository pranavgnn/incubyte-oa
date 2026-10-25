import { env } from "../config/env.js";
import { migrateDatabase } from "./migrator.js";

await migrateDatabase(env.DATABASE_URL);
console.log("Migrations applied.");
