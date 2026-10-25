import type { RequestHandler } from "express";
import type { z } from "zod";
import { ValidationError } from "../errors/app-error.js";

type RequestSchemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

// Parses the request parts against their schemas and replaces them with
// the parsed output, so handlers only ever see validated, normalised data.
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = parse(schemas.body, req.body);
    }
    if (schemas.params) {
      req.params = parse(schemas.params, req.params) as typeof req.params;
    }
    if (schemas.query) {
      // Express 5 exposes req.query as a getter that re-parses the URL on
      // every read, so assignment is not possible; shadow it on the instance.
      Object.defineProperty(req, "query", {
        value: parse(schemas.query, req.query),
        enumerable: true,
      });
    }
    next();
  };
}

function parse(schema: z.ZodType, input: unknown): unknown {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      "Request validation failed",
      result.error.issues.map(({ path, message }) => ({ path, message })),
    );
  }
  return result.data;
}
