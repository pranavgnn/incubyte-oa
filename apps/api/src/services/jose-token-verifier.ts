import { roleSchema } from "@dealership/shared";
import { errors, jwtVerify } from "jose";
import { z } from "zod";
import { UnauthorizedError } from "../errors/app-error.js";
import type { AuthContext, TokenVerifier } from "./auth-service.js";

// The claims JoseTokenIssuer writes. A valid signature alone does not
// make them trustworthy shapes, so they are parsed like any other input.
const claimsSchema = z.object({
  sub: z.uuid(),
  role: roleSchema,
});

export class JoseTokenVerifier implements TokenVerifier {
  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  async verify(token: string): Promise<AuthContext> {
    let payload: unknown;
    try {
      // Pinned to the one algorithm JoseTokenIssuer signs with.
      ({ payload } = await jwtVerify(token, this.key, { algorithms: ["HS256"] }));
    } catch (error) {
      // Malformed, badly signed and expired tokens all throw JOSEError
      // subclasses; the caller only needs to know the token is no good.
      if (error instanceof errors.JOSEError) {
        throw new UnauthorizedError("Invalid or expired token", [], { cause: error });
      }
      throw error;
    }
    const claims = claimsSchema.safeParse(payload);
    if (!claims.success) {
      throw new UnauthorizedError("Invalid or expired token", [], { cause: claims.error });
    }
    return { userId: claims.data.sub, role: claims.data.role };
  }
}
