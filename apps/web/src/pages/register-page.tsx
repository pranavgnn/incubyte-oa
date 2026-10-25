import { registerRequestSchema } from "@dealership/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { useApi } from "@/api/api-provider";
import { authFormErrorMap } from "@/auth/auth-form-errors";
import { useAuth } from "@/auth/auth-provider";
import { safeNextPath } from "@/auth/safe-next";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// The API's register schema plus a client-only confirmation. Only email
// and password are ever sent.
const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
    // Check the match even while other fields are still invalid.
    when: () => true,
  });

type RegisterFormValues = z.input<typeof registerFormSchema>;

export function RegisterPage() {
  const { authApi } = useApi();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema, { error: authFormErrorMap }),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const session = await authApi.register(values);
    signIn(session);
    navigate(safeNextPath(searchParams.get("next")), { replace: true });
    toast.success(`Account created — signed in as ${session.user.email}`);
  });

  return (
    <Card className="w-full max-w-form">
      <CardHeader>
        <CardTitle>
          <h1 className="font-display text-h1 font-bold">Create account</h1>
        </CardTitle>
        <CardDescription>Register to browse and buy from the showroom.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? "register-email-error" : undefined}
                  />
                  <FieldError id="register-email-error" errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-password">Password</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="register-password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.invalid
                        ? "register-password-hint register-password-error"
                        : "register-password-hint"
                    }
                  />
                  <FieldDescription id="register-password-hint">
                    At least 8 characters, up to 72 bytes.
                  </FieldDescription>
                  <FieldError id="register-password-error" errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-confirm-password">Confirm password</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="register-confirm-password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.invalid ? "register-confirm-password-error" : undefined
                    }
                  />
                  <FieldError id="register-confirm-password-error" errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
