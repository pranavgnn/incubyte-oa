import { describe, expect, it } from "vitest";
import { createTokenStorage } from "@/auth/token-storage";

describe("token storage", () => {
  it("keeps the token in localStorage until it is cleared", () => {
    const tokens = createTokenStorage(localStorage);

    expect(tokens.get()).toBeNull();
    tokens.set("t0k3n");
    expect(createTokenStorage(localStorage).get()).toBe("t0k3n");
    tokens.clear();
    expect(tokens.get()).toBeNull();
  });

  it("acts as empty instead of throwing when storage is unavailable", () => {
    const blocked = {
      getItem() {
        throw new DOMException("Access denied", "SecurityError");
      },
      setItem() {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
      removeItem() {
        throw new DOMException("Access denied", "SecurityError");
      },
    } as unknown as Storage;
    const tokens = createTokenStorage(blocked);

    expect(tokens.get()).toBeNull();
    expect(() => tokens.set("t0k3n")).not.toThrow();
    expect(() => tokens.clear()).not.toThrow();
  });
});
