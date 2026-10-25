import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "./auth-provider";

// Layout route that only renders its child routes for a signed-in user.
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "signed-in") return <Outlet />;

  // A stored token is still being checked against /me; deciding now would
  // bounce a signed-in user to /login on every reload.
  if (state.status === "loading") {
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  const next = `${location.pathname}${location.search}`;
  return <Navigate to={`/login?${new URLSearchParams({ next })}`} replace />;
}
