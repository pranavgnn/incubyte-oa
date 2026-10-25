import { z } from "zod";
import { ApiError } from "./errors";

export type FieldError<F extends string> = { field: F; message: string };

export type FormErrors<F extends string> = {
  fieldErrors: FieldError<F>[];
  formError: string | null;
};

// One VALIDATION_ERROR detail as the API's validate middleware sends it.
const issueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
});

// Turns any error from a form submit into inline field errors plus one
// optional message for the form-level Alert. The alert is used whenever
// something could not be shown next to a field.
export function toFormErrors<F extends string>(
  error: unknown,
  fields: readonly F[],
): FormErrors<F> {
  if (!(error instanceof ApiError)) {
    return { fieldErrors: [], formError: "Something went wrong — please try again" };
  }
  const fieldErrors = error.code === "VALIDATION_ERROR" ? placeOnFields(error.details, fields) : [];
  const allPlaced = fieldErrors.length > 0 && fieldErrors.length === error.details.length;
  return { fieldErrors, formError: allPlaced ? null : error.message };
}

function placeOnFields<F extends string>(
  details: unknown[],
  fields: readonly F[],
): FieldError<F>[] {
  return details.flatMap((detail) => {
    const issue = issueSchema.safeParse(detail);
    const field = issue.success && fields.find((name) => name === issue.data.path[0]);
    return issue.success && field ? [{ field, message: issue.data.message }] : [];
  });
}
