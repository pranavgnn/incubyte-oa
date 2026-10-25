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
});
