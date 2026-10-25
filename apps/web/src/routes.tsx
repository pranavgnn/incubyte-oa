import { Navigate, type RouteObject } from "react-router";
import { RequireAuth } from "@/auth/require-auth";
import { AppShell } from "@/components/app-shell";
import { AuthLayout } from "@/components/auth-layout";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [{ element: <AppShell />, children: [{ path: "/", element: <DashboardPage /> }] }],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
