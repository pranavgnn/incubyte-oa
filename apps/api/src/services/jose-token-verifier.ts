import type { Role } from "@dealership/shared";
import { jwtVerify } from "jose";
import type { AuthContext, TokenVerifier } from "./auth-service.js";

export class JoseTokenVerifier implements TokenVerifier {
  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  async verify(token: string): Promise<AuthContext> {
    const { payload } = await jwtVerify(token, this.key);
    return { userId: payload.sub as string, role: payload.role as Role };
  }
}
