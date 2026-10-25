import type { RequestHandler } from "express";
import { NotFoundError } from "../errors/app-error.js";

// Mounted after every route, so reaching it means nothing matched.
export const notFound: RequestHandler = (req) => {
  throw new NotFoundError(`Route ${req.method} ${req.path} not found`);
};
