import { z } from "zod";
import { ApiError } from "./errors";

export type FormErrors<F extends string> = {
  fieldErrors: { field: F; message: string }[];
  formError: string | null;
};

// One VALIDATION_ERROR detail as the API's validate middleware sends it.
const issueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
});

// Turns any error from a form submit into inline field errors plus one
// optional message for the form-level Alert.
export function toFormErrors<F extends string>(
  error: unknown,
  fields: readonly F[],
): FormErrors<F> {
  const result: FormErrors<F> = { fieldErrors: [], formError: null };
  if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
    for (const detail of error.details) {
      const issue = issueSchema.safeParse(detail);
      if (!issue.success) continue;
      const field = fields.find((name) => name === issue.data.path[0]);
      if (field) result.fieldErrors.push({ field, message: issue.data.message });
    }
  }
  return result;
}
