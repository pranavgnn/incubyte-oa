import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import type { PasswordHasher } from "../services/auth-service.js";
import type { Database } from "./client.js";
import { users } from "./schema.js";

export type AdminCredentials = {
  email: string;
  password: string;
};

// 24 random bytes give a 32-character base64url password: well inside
// bcrypt's 72-byte limit and far beyond guessing.
const PASSWORD_BYTES = 24;

// The password exists only in the returned value. It is never stored in
// plain text and never written anywhere by this function.
export async function seedAdmin(
  db: Database,
  email: string,
  passwords: PasswordHasher,
): Promise<AdminCredentials> {
  const password = randomBytes(PASSWORD_BYTES).toString("base64url");
  const passwordHash = await passwords.hash(password);
  // Raw SQL because Drizzle's onConflictDoUpdate only accepts columns as
  // the target. The target here is the case-insensitive unique index, so
  // an existing row is reset whatever case its email was stored in, and
  // a regular user who registered that email first is promoted.
  await db.execute(sql`
    INSERT INTO ${users} (email, password_hash, role)
    VALUES (${email}, ${passwordHash}, 'admin')
    ON CONFLICT (lower(email)) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
  `);
  return { email, password };
}
