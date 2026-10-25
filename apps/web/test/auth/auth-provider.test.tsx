import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createAuthApi } from "@/api/auth-api";
import { createApiClient } from "@/api/client";
import { AuthProvider, useAuth } from "@/auth/auth-provider";
import { createTokenStorage } from "@/auth/token-storage";
import { server } from "../msw/server";

const baseUrl = "http://api.test";
const user = {
  id: "4c1d2a4e-8f7b-4d5e-9a3c-1b2c3d4e5f60",
  email: "alice@example.com",
  role: "user",
} as const;

function errorBody(code: string, message: string) {
  return { error: { code, message, details: [] } };
}

function AuthStatus() {
  const { state } = useAuth();
  return <p>{state.status === "signed-in" ? `signed in as ${state.user.email}` : state.status}</p>;
}

function renderWithAuth() {
  const tokens = createTokenStorage(localStorage);
  const authApi = createAuthApi(createApiClient({ baseUrl, getToken: tokens.get }));
  render(
    <AuthProvider authApi={authApi} tokens={tokens}>
      <AuthStatus />
    </AuthProvider>,
  );
  return { tokens };
}

describe("AuthProvider", () => {
  it("is signed out without calling the API when no token is stored", async () => {
    renderWithAuth();

    // Unhandled requests fail the test, so reaching this state proves /me was not called.
    expect(await screen.findByText("signed-out")).toBeInTheDocument();
  });

  it("restores the user from /api/auth/me when a token is stored", async () => {
    localStorage.setItem("dealership.token", "t0k3n");
    server.use(
      http.get(`${baseUrl}/api/auth/me`, ({ request }) =>
        request.headers.get("Authorization") === "Bearer t0k3n"
          ? HttpResponse.json(user)
          : HttpResponse.json(errorBody("UNAUTHORIZED", "Missing token"), { status: 401 }),
      ),
    );

    renderWithAuth();

    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("signed in as alice@example.com")).toBeInTheDocument();
  });

  it("clears the stored token and signs out when /api/auth/me answers 401", async () => {
    localStorage.setItem("dealership.token", "expired");
    server.use(
      http.get(`${baseUrl}/api/auth/me`, () =>
        HttpResponse.json(errorBody("UNAUTHORIZED", "Invalid or expired token"), { status: 401 }),
      ),
    );

    const { tokens } = renderWithAuth();

    expect(await screen.findByText("signed-out")).toBeInTheDocument();
    expect(tokens.get()).toBeNull();
  });
});
