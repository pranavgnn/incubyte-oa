import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, type RouteObject, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { ApiProvider } from "@/api/api-provider";
import { createAuthApi } from "@/api/auth-api";
import { createApiClient } from "@/api/client";
import { AuthProvider } from "@/auth/auth-provider";
import { createSessionExpiry } from "@/auth/session-expiry";
import { createTokenStorage } from "@/auth/token-storage";

export const baseUrl = "http://api.test";

export const aliceUser = {
  id: "4c1d2a4e-8f7b-4d5e-9a3c-1b2c3d4e5f60",
  email: "alice@example.com",
  role: "user",
} as const;

export function errorBody(code: string, message: string, details: unknown[] = []) {
  return { error: { code, message, details } };
}

// Wires the real client, auth api, token storage and session expiry the
// way the app does, so tests exercise the same paths.
export function createTestServices() {
  const tokens = createTokenStorage(localStorage);
  const sessionExpiry = createSessionExpiry();
  const client = createApiClient({
    baseUrl,
    getToken: tokens.get,
    onUnauthorized: sessionExpiry.notify,
  });
  return { tokens, sessionExpiry, client, authApi: createAuthApi(client) };
}

export type TestServices = ReturnType<typeof createTestServices>;

export function renderRoutes(routes: RouteObject[], initialPath: string) {
  const services = createTestServices();
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  const view = render(
    <AuthProvider
      authApi={services.authApi}
      tokens={services.tokens}
      sessionExpiry={services.sessionExpiry}
    >
      <ApiProvider api={{ authApi: services.authApi }}>
        <RouterProvider router={router} />
      </ApiProvider>
      <Toaster />
    </AuthProvider>,
  );
  return { ...view, ...services, router };
}

export function Page({ title }: { title: string }): ReactNode {
  return <h1>{title}</h1>;
}
