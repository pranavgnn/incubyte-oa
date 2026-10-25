import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BcryptPasswordHasher } from "../../src/services/bcrypt-password-hasher.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BcryptPasswordHasher.verify", () => {
  it("returns false for a missing hash after a real bcrypt comparison at the same cost as stored hashes", async () => {
    const hasher = new BcryptPasswordHasher();
    const compare = vi.spyOn(bcrypt, "compare");

    expect(await hasher.verify("correct-horse", undefined)).toBe(false);

    expect(compare).toHaveBeenCalledTimes(1);
    const [, comparedHash] = compare.mock.calls[0] ?? [];
    const storedCost = bcrypt.getRounds(await hasher.hash("correct-horse"));
    expect(bcrypt.getRounds(String(comparedHash))).toBe(storedCost);
  });
});
