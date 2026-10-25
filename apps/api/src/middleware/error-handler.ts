import type { ErrorResponse } from "@dealership/shared";
import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

// The single place that turns errors into the standard error response.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(toBody(err.code, err.message, err.details));
    return;
  }
  // Unknown errors are bugs: log the details server-side, tell the client nothing.
  console.error(err);
  res.status(500).json(toBody("INTERNAL_ERROR", "Internal server error", []));
};

function toBody(code: string, message: string, details: unknown[]): ErrorResponse {
  return { error: { code, message, details } };
}
