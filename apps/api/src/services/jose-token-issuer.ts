import type { User } from "@dealership/shared";
import { SignJWT } from "jose";
import type { TokenIssuer } from "./auth-service.js";

export class JoseTokenIssuer implements TokenIssuer {
  private readonly key: Uint8Array;

  // expiresIn uses jose's duration format, e.g. "15m" or "1 hour".
  constructor(
    secret: string,
    private readonly expiresIn: string,
  ) {
    this.key = new TextEncoder().encode(secret);
  }

  issue(user: User): Promise<string> {
    return new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.key);
  }
}
