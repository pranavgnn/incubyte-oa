import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { RequireAuth } from "@/auth/require-auth";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/theme/theme-provider";
import { aliceUser, baseUrl, Page, renderRoutes } from "../helpers";
import { server } from "../msw/server";

function renderShell(user: { id: string; email: string; role: "user" | "admin" }) {
  localStorage.setItem("dealership.token", "t0k3n");
  server.use(http.get(`${baseUrl}/api/auth/me`, () => HttpResponse.json(user)));
  return renderRoutes(
    [
      { path: "/login", element: <Page title="Login" /> },
      {
        element: (
          <ThemeProvider storage={localStorage} prefersDark={() => false}>
            <RequireAuth />
          </ThemeProvider>
        ),
        children: [
          { element: <AppShell />, children: [{ path: "/", element: <Page title="Dashboard" /> }] },
        ],
      },
    ],
    "/",
  );
}

describe("AppShell user menu", () => {
  it("shows who is signed in and their role", async () => {
    renderShell({ ...aliceUser, role: "admin" });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Account menu" }));

    const menu = await screen.findByRole("menu");
    expect(menu).toHaveTextContent("alice@example.com");
    expect(menu).toHaveTextContent("Admin");
  });

  it("signs out and returns to the login page", async () => {
    const { tokens } = renderShell(aliceUser);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Account menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(tokens.get()).toBeNull();
  });
});
