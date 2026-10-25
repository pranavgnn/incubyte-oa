import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useApi } from "@/api/api-provider";
import { type LoginRequest, loginRequestSchema } from "@/api/contracts";
import { ApiError } from "@/api/errors";
import { applyFormErrors } from "@/auth/apply-form-errors";
import { authFormErrorMap } from "@/auth/auth-form-errors";
import { useAuth } from "@/auth/auth-provider";
import { safeNextPath } from "@/auth/safe-next";
import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";

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
    try {
      const session = await authApi.login(credentials);
      signIn(session);
      navigate(safeNextPath(searchParams.get("next")), { replace: true });
      toast.success(`Welcome back, ${session.user.email}`);
    } catch (error) {
      // The API says "invalid credentials" for both unknown email and wrong password.
      if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
        setFormError("Invalid email or password");
        return;
      }
      setFormError(applyFormErrors(error, ["email", "password"] as const, form.setError));
    }
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
            <FormField
              control={form.control}
              name="email"
              id="login-email"
              label="Email"
              type="email"
              autoComplete="email"
            />
            <FormField
              control={form.control}
              name="password"
              id="login-password"
              label="Password"
              type="password"
              autoComplete="current-password"
            />
            <FormAlert message={formError} />
            <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Signing in…">
              Sign in
            </SubmitButton>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
