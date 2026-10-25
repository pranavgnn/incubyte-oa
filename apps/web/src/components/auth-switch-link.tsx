import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

// "No account? Create one" / "Already registered? Sign in". Keeps the
// query string so ?next= survives switching between the two forms.
export function AuthSwitchLink({
  prompt,
  to,
  children,
}: {
  prompt: string;
  to: "/login" | "/register";
  children: ReactNode;
}) {
  const { search } = useLocation();
  return (
    <p className="mt-6 text-center text-label text-muted-foreground">
      {prompt}{" "}
      <Link
        to={{ pathname: to, search }}
        className="font-medium text-brand-strong underline-offset-4 hover:underline"
      >
        {children}
      </Link>
    </p>
  );
}
