import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BcryptPasswordHasher } from "../../src/services/bcrypt-password-hasher.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BcryptPasswordHasher", () => {
  it.each([4, 12])("hashes at the injected cost %i", async (cost) => {
    const hasher = new BcryptPasswordHasher(cost);

    expect(bcrypt.getRounds(await hasher.hash("correct-horse"))).toBe(cost);
  });

  it.each([4, 12])(
    "returns false for a missing hash after a real bcrypt comparison at cost %i, the same as stored hashes",
    async (cost) => {
      const hasher = new BcryptPasswordHasher(cost);
      const compare = vi.spyOn(bcrypt, "compare");

      expect(await hasher.verify("correct-horse", undefined)).toBe(false);

      expect(compare).toHaveBeenCalledTimes(1);
      const [, comparedHash] = compare.mock.calls[0] ?? [];
      expect(bcrypt.getRounds(String(comparedHash))).toBe(cost);
    },
  );
});
