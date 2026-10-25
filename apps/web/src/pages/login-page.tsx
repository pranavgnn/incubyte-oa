import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useApi } from "@/api/api-provider";
import { type LoginRequest, loginRequestSchema } from "@/api/contracts";
import { authFormErrorMap } from "@/auth/auth-form-errors";
import { useAuth } from "@/auth/auth-provider";
import { safeNextPath } from "@/auth/safe-next";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const { authApi } = useApi();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema, { error: authFormErrorMap }),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (credentials) => {
    const session = await authApi.login(credentials);
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
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
