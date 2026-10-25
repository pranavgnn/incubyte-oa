import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toFormErrors } from "@/api/form-errors";

// Puts a submit error on the form: field errors via setError (focusing
// the first), and returns the message for the form alert, if any.
export function applyFormErrors<T extends FieldValues, F extends Path<T> & string>(
  error: unknown,
  fields: readonly F[],
  setError: UseFormSetError<T>,
): string | null {
  const { fieldErrors, formError } = toFormErrors(error, fields);
  for (const { field, message } of fieldErrors) {
    setError(field, { message }, { shouldFocus: true });
  }
  return formError;
}
