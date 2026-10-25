export type FormErrors<F extends string> = {
  fieldErrors: { field: F; message: string }[];
  formError: string | null;
};

// Turns any error from a form submit into inline field errors plus one
// optional message for the form-level Alert.
export function toFormErrors<F extends string>(
  _error: unknown,
  _fields: readonly F[],
): FormErrors<F> {
  throw new Error("not implemented");
}
