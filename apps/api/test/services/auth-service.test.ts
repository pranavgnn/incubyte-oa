import type { User } from "@dealership/shared";
import { describe, expect, it } from "vitest";
import { UnauthorizedError } from "../../src/errors/app-error.js";
import {
  AuthService,
  type NewUser,
  type PasswordHasher,
  type TokenIssuer,
  type UserRepository,
  type UserWithPasswordHash,
} from "../../src/services/auth-service.js";

class FakeUserRepository implements UserRepository {
  constructor(private readonly rows: UserWithPasswordHash[] = []) {}

  async create(user: NewUser): Promise<User> {
    return { id: "00000000-0000-4000-8000-000000000001", email: user.email, role: "user" };
  }

  async findByEmail(email: string): Promise<UserWithPasswordHash | undefined> {
    return this.rows.find((row) => row.email === email);
  }
}

// Records every comparison so a test can see whether one happened.
class RecordingPasswordHasher implements PasswordHasher {
  readonly verifyCalls: Array<{ password: string; hash: string | undefined }> = [];

  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string | undefined): Promise<boolean> {
    this.verifyCalls.push({ password, hash });
    return hash === `hashed:${password}`;
  }
}

const fakeTokens: TokenIssuer = { issue: async (user) => `token-for-${user.id}` };

describe("AuthService.login", () => {
  it("still runs a password comparison when the email is unknown, so timing does not reveal it", async () => {
    const hasher = new RecordingPasswordHasher();
    const service = new AuthService(new FakeUserRepository(), hasher, fakeTokens);

    await expect(
      service.login({ email: "nobody@example.com", password: "correct-horse" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(hasher.verifyCalls).toEqual([{ password: "correct-horse", hash: undefined }]);
  });
});
