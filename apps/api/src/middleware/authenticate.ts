import type { RequestHandler } from "express";
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
    const token = (req.headers.authorization ?? "").slice(BEARER_PREFIX.length);
    req.auth = await verifier.verify(token);
    next();
  };
}
