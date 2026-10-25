import type { ErrorResponse } from "@dealership/shared";
import type { ErrorRequestHandler } from "express";
import { AppError, PayloadTooLargeError, ValidationError } from "../errors/app-error.js";

// The single place that turns errors into the standard error response.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const error = fromBodyParser(err);
  if (error instanceof AppError) {
    res.status(error.status).json(toBody(error.code, error.message, error.details));
    return;
  }
  // Unknown errors are bugs: log the details server-side, tell the client nothing.
  console.error(error);
  res.status(500).json(toBody("INTERNAL_ERROR", "Internal server error", []));
};

// express.json() reports client mistakes as plain errors tagged with a
// `type`; translate the ones we expect so they are not treated as bugs.
function fromBodyParser(err: unknown): unknown {
  const type = (err as { type?: unknown } | null)?.type;
  if (type === "entity.parse.failed") {
    return new ValidationError("Malformed JSON body", [], { cause: err });
  }
  if (type === "entity.too.large") {
    return new PayloadTooLargeError("Request body is too large", [], { cause: err });
  }
  return err;
}

function toBody(code: string, message: string, details: unknown[]): ErrorResponse {
  return { error: { code, message, details } };
}
