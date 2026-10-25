import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiProvider } from "@/api/api-provider";
import { createAuthApi } from "@/api/auth-api";
import { createApiClient } from "@/api/client";
import { AuthProvider } from "@/auth/auth-provider";
import { createSessionExpiry } from "@/auth/session-expiry";
import { createTokenStorage } from "@/auth/token-storage";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/env";
import { routes } from "@/routes";
import { ThemeProvider } from "@/theme/theme-provider";
import "./index.css";

// Composition root: the only place concrete services are created.
const tokens = createTokenStorage(localStorage);
const sessionExpiry = createSessionExpiry();
const client = createApiClient({
  baseUrl: env.VITE_API_URL,
  getToken: tokens.get,
  onUnauthorized: sessionExpiry.notify,
});
const api = { authApi: createAuthApi(client) };
const router = createBrowserRouter(routes);

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element in index.html");
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider
      storage={localStorage}
      prefersDark={() => window.matchMedia("(prefers-color-scheme: dark)").matches}
    >
      <ApiProvider api={api}>
        <AuthProvider authApi={api.authApi} tokens={tokens} sessionExpiry={sessionExpiry}>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </AuthProvider>
      </ApiProvider>
    </ThemeProvider>
  </StrictMode>,
);
