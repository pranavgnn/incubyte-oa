import bcrypt from "bcryptjs";
import type { PasswordHasher } from "./auth-service.js";

// 12 rounds keeps hashing around a few hundred milliseconds: slow for
// brute force, still fine for a login request. Production wiring uses
// this; tests inject a lower cost to stay fast.
export const BCRYPT_COST = 12;

// Salt and checksum of a hash of random bytes nobody knows. Comparing
// against it when no user matched makes an unknown email take as long as
// a wrong password. bcrypt reads the cost from the hash prefix, so the
// prefix is built from the hasher's own cost to keep the timing equal.
const DUMMY_SALT_AND_CHECKSUM = "3R.TPZjti1Hf9OvXQiGEKO49Xr.Sc1Q6auw1ZWH/6AmO7FEbGvoam";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly dummyHash: string;

  constructor(private readonly cost: number) {
    this.dummyHash = `$2b$${String(cost).padStart(2, "0")}$${DUMMY_SALT_AND_CHECKSUM}`;
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.cost);
  }

  async verify(password: string, hash: string | undefined): Promise<boolean> {
    if (hash === undefined) {
      await bcrypt.compare(password, this.dummyHash);
      return false;
    }
    return bcrypt.compare(password, hash);
  }
}
