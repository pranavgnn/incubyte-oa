import type { Role } from "@dealership/shared";
import type { RequestHandler } from "express";

export function requireRole(_role: Role): RequestHandler {
  throw new Error("not implemented");
}
