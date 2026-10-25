import type { Role } from "@dealership/shared";
import type { RequestHandler } from "express";
import { ForbiddenError } from "../errors/app-error.js";

// Mount after authenticate, which sets req.auth.
export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (req.auth?.role !== role) throw new ForbiddenError("Insufficient permissions");
    next();
  };
}
