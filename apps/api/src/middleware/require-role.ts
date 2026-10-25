import type { Role } from "@dealership/shared";
import type { RequestHandler } from "express";

// Mount after authenticate, which sets req.auth.
export function requireRole(_role: Role): RequestHandler {
  return (_req, _res, next) => {
    next();
  };
}
