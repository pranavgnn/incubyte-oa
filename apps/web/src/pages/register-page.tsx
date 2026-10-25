import { registerRequestSchema } from "@dealership/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { useApi } from "@/api/api-provider";
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
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema, { error: authFormErrorMap }),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session = await authApi.register(values);
      signIn(session);
      navigate(safeNextPath(searchParams.get("next")), { replace: true });
      toast.success(`Account created — signed in as ${session.user.email}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        form.setError(
          "email",
          { message: "An account with this email already exists" },
          { shouldFocus: true },
        );
        return;
      }
      setFormError(applyFormErrors(error, ["email", "password"] as const, form.setError));
    }
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
            <FormField
              control={form.control}
              name="email"
              id="register-email"
              label="Email"
              type="email"
              autoComplete="email"
            />
            <FormField
              control={form.control}
              name="password"
              id="register-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters, up to 72 bytes."
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              id="register-confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
            />
            <FormAlert message={formError} />
            <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Creating account…">
              Create account
            </SubmitButton>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
