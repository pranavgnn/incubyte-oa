import type { PasswordHasher } from "../services/auth-service.js";
import type { Database } from "./client.js";

export type AdminCredentials = {
  email: string;
  password: string;
};

export async function seedAdmin(
  _db: Database,
  _email: string,
  _passwords: PasswordHasher,
): Promise<AdminCredentials> {
  throw new Error("not implemented");
}
