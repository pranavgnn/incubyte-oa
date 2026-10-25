import bcrypt from "bcryptjs";
import type { PasswordHasher } from "./auth-service.js";

// 12 rounds keeps hashing around a few hundred milliseconds: slow for
// brute force, still fine for a login request.
const COST = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, COST);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
