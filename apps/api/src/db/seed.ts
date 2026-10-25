// Creates the admin user, or resets its password if it exists. Run with
// `pnpm --filter api db:seed`; the logic and its tests live in seed-admin.ts.
import { env } from "../config/env.js";
import { BCRYPT_COST, BcryptPasswordHasher } from "../services/bcrypt-password-hasher.js";
import { createDb } from "./client.js";
import { runSeed } from "./seed-admin.js";

const { db, pool } = createDb(env.DATABASE_URL);
try {
  await runSeed({
    db,
    adminEmail: env.ADMIN_EMAIL,
    passwords: new BcryptPasswordHasher(BCRYPT_COST),
    log: (message) => console.log(message),
  });
} finally {
  await pool.end();
}
