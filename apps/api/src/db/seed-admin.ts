import { randomBytes } from "node:crypto";
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
  await db.insert(users).values({ email, passwordHash, role: "admin" });
  return { email, password };
}
