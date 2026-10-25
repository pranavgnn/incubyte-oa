import type { RequestHandler } from "express";
import { UnauthorizedError } from "../errors/app-error.js";
import type { AuthContext, TokenVerifier } from "../services/auth-service.js";

declare global {
  namespace Express {
    interface Request {
      // Set by authenticate; absent on routes that do not mount it.
      auth?: AuthContext;
    }
  }
}

const BEARER_PREFIX = "Bearer ";

// Verifies the bearer token and records who the caller is on req.auth.
export function authenticate(verifier: TokenVerifier): RequestHandler {
  return async (req, _res, next) => {
    const header = req.headers.authorization;
    if (header === undefined) throw new UnauthorizedError("Authentication required");
    req.auth = await verifier.verify(header.slice(BEARER_PREFIX.length));
    next();
  };
}
