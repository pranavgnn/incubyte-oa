import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./auth-provider";

// Layout route that only renders its child routes for a signed-in user.
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "signed-in") return <Outlet />;

  const next = `${location.pathname}${location.search}`;
  return <Navigate to={`/login?${new URLSearchParams({ next })}`} replace />;
}
