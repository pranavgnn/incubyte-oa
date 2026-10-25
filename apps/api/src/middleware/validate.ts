import type { RequestHandler } from "express";
import type { z } from "zod";
import { ValidationError } from "../errors/app-error.js";

type RequestSchemas = {
  body?: z.ZodType;
};

// Parses the request parts against their schemas and replaces them with
// the parsed output, so handlers only ever see validated, normalised data.
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(
          "Request validation failed",
          result.error.issues.map(({ path, message }) => ({ path, message })),
        );
      }
      req.body = result.data;
    }
    next();
  };
}
