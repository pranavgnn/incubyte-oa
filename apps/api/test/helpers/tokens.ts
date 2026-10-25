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
