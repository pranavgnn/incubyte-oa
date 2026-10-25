import bcrypt from "bcryptjs";
import type { PasswordHasher } from "./auth-service.js";

// 12 rounds keeps hashing around a few hundred milliseconds: slow for
// brute force, still fine for a login request.
const COST = 12;

// A cost-12 hash of random bytes nobody knows. Comparing against it when
// no user matched makes an unknown email take as long as a wrong password.
// It must keep the same cost as COST, which the hasher tests check.
const DUMMY_HASH = "$2b$12$3R.TPZjti1Hf9OvXQiGEKO49Xr.Sc1Q6auw1ZWH/6AmO7FEbGvoam";

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, COST);
  }

  async verify(password: string, hash: string | undefined): Promise<boolean> {
    if (hash === undefined) {
      await bcrypt.compare(password, DUMMY_HASH);
      return false;
    }
    return bcrypt.compare(password, hash);
  }
}
