import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { PasswordInput } from "@/components/password-input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  id: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  hint?: string;
};

// A labelled email or password input bound to react-hook-form. The hint
// and the error are linked through aria-describedby.
export function FormField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  type,
  autoComplete,
  hint,
}: FormFieldProps<T>) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const describedBy = [hint && hintId, fieldState.invalid && errorId].filter(Boolean);
        const inputProps = {
          ...field,
          id,
          autoComplete,
          "aria-invalid": fieldState.invalid,
          "aria-describedby": describedBy.length > 0 ? describedBy.join(" ") : undefined,
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {type === "password" ? (
              <PasswordInput {...inputProps} />
            ) : (
              <Input {...inputProps} type={type} />
            )}
            {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
            <FieldError id={errorId} errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
