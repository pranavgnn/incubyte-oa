import type { Role } from "@dealership/shared";
import { errors, jwtVerify } from "jose";
import { UnauthorizedError } from "../errors/app-error.js";
import type { AuthContext, TokenVerifier } from "./auth-service.js";

export class JoseTokenVerifier implements TokenVerifier {
  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  async verify(token: string): Promise<AuthContext> {
    try {
      // Pinned to the one algorithm JoseTokenIssuer signs with.
      const { payload } = await jwtVerify(token, this.key, { algorithms: ["HS256"] });
      return { userId: payload.sub as string, role: payload.role as Role };
    } catch (error) {
      // Malformed, badly signed and expired tokens all throw JOSEError
      // subclasses; the caller only needs to know the token is no good.
      if (error instanceof errors.JOSEError) {
        throw new UnauthorizedError("Invalid or expired token", [], { cause: error });
      }
      throw error;
    }
  }
}
