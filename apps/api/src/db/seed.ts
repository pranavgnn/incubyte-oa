// Creates the admin user, or resets its password if it exists, and fills
// an empty vehicles table with a sample catalogue. Run with
// `pnpm --filter api db:seed`; the logic and its tests live in
// seed-admin.ts and seed-vehicles.ts.
import { env } from "../config/env.js";
import { BCRYPT_COST, BcryptPasswordHasher } from "../services/bcrypt-password-hasher.js";
import { createDb } from "./client.js";
import { runSeed } from "./seed-admin.js";
import { seedVehicles } from "./seed-vehicles.js";

const { db, pool } = createDb(env.DATABASE_URL);
try {
  await runSeed({
    db,
    adminEmail: env.ADMIN_EMAIL,
    passwords: new BcryptPasswordHasher(BCRYPT_COST),
    log: (message) => console.log(message),
  });
  const inserted = await seedVehicles(db);
  console.log(
    inserted > 0
      ? `Inserted ${inserted} sample vehicles.`
      : "Vehicles table is not empty; sample vehicles skipped.",
  );
} finally {
  await pool.end();
}
