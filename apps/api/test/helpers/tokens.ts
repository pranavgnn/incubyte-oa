import { randomUUID } from "node:crypto";
import { type JWTPayload, SignJWT } from "jose";
import { TEST_JWT_SECRET } from "./build-app.js";

type SignOptions = {
  secret?: string;
  alg?: string;
  // Seconds since the epoch; defaults to 15 minutes from now.
  expiresAt?: number;
};

// Signs arbitrary claims, so tests can build tokens the API would never
// issue: wrong secret, wrong algorithm, expired, or with bad claims.
export function signToken(claims: JWTPayload, options: SignOptions = {}): Promise<string> {
  const { secret = TEST_JWT_SECRET, alg = "HS256" } = options;
  const expiresAt = options.expiresAt ?? Math.floor(Date.now() / 1000) + 15 * 60;
  return new SignJWT(claims)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(secret));
}

// A valid bearer header for a caller with the given role. authenticate
// trusts the verified claims, so no user row is needed.
export async function bearer(role: "user" | "admin"): Promise<string> {
  return `Bearer ${await signToken({ sub: randomUUID(), role })}`;
}
