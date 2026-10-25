import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAuthApi } from "@/api/auth-api";
import { createApiClient } from "@/api/client";
import { AuthProvider, useAuth } from "@/auth/auth-provider";
import { createTokenStorage } from "@/auth/token-storage";

const baseUrl = "http://api.test";

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
});
