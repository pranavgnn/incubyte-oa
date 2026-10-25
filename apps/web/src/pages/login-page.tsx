import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useApi } from "@/api/api-provider";
import { type LoginRequest, loginRequestSchema } from "@/api/contracts";
import { ApiError } from "@/api/errors";
import { toFormErrors } from "@/api/form-errors";
import { authFormErrorMap } from "@/auth/auth-form-errors";
import { useAuth } from "@/auth/auth-provider";
import { safeNextPath } from "@/auth/safe-next";
import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const { authApi } = useApi();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema, { error: authFormErrorMap }),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (credentials) => {
    setFormError(null);
    let session: Awaited<ReturnType<typeof authApi.login>>;
    try {
      session = await authApi.login(credentials);
    } catch (error) {
      // The API says "invalid credentials" for both unknown email and wrong password.
      if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
        setFormError("Invalid email or password");
        return;
      }
      const { fieldErrors, formError } = toFormErrors(error, ["email", "password"] as const);
      for (const { field, message } of fieldErrors) {
        form.setError(field, { message }, { shouldFocus: true });
      }
      setFormError(formError);
      return;
    }
    signIn(session);
    navigate(safeNextPath(searchParams.get("next")), { replace: true });
    toast.success(`Welcome back, ${session.user.email}`);
  });

  return (
    <Card className="w-full max-w-form">
      <CardHeader>
        <CardTitle>
          <h1 className="font-display text-h1 font-bold">Sign in</h1>
        </CardTitle>
        <CardDescription>Welcome back to the showroom floor.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? "login-email-error" : undefined}
                  />
                  <FieldError id="login-email-error" errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="login-password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? "login-password-error" : undefined}
                  />
                  <FieldError id="login-password-error" errors={[fieldState.error]} />
                </Field>
              )}
            />
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
