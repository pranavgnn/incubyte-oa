import type { Role } from "@dealership/shared";
import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error.js";

// Mount after authenticate, which sets req.auth. Without it there is no
// identity to check, so the route stays closed with a 401.
export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) throw new UnauthorizedError("Authentication required");
    if (req.auth.role !== role) throw new ForbiddenError("Insufficient permissions");
    next();
  };
}
