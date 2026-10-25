import type { ErrorResponse } from "@dealership/shared";
import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

// The single place that turns errors into the standard error response.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (!(err instanceof AppError)) {
    next(err);
    return;
  }
  const body: ErrorResponse = {
    error: { code: err.code, message: err.message, details: err.details },
  };
  res.status(err.status).json(body);
};
