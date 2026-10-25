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

// "Bearer <token>" with a non-empty token and nothing after it.
const BEARER = /^Bearer (\S+)$/;

// Verifies the bearer token and records who the caller is on req.auth.
export function authenticate(verifier: TokenVerifier): RequestHandler {
  return async (req, _res, next) => {
    const token = BEARER.exec(req.headers.authorization ?? "")?.[1];
    if (token === undefined) throw new UnauthorizedError("Authentication required");
    req.auth = await verifier.verify(token);
    next();
  };
}
