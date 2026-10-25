import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { RequireAuth } from "@/auth/require-auth";
import { aliceUser, baseUrl, Page, renderRoutes } from "../helpers";
import { server } from "../msw/server";

const routes = [
  { path: "/login", element: <Page title="Login" /> },
  {
    element: <RequireAuth />,
    children: [{ path: "/", element: <Page title="Dashboard" /> }],
  },
];

describe("RequireAuth", () => {
  it("sends a signed-out visitor to /login with the page they wanted as next", async () => {
    const { router } = renderRoutes(routes, "/?make=Tata&q=nex");

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(new URLSearchParams(router.state.location.search).get("next")).toBe("/?make=Tata&q=nex");
  });

  it("waits for a stored session to be restored, then renders the page", async () => {
    localStorage.setItem("dealership.token", "t0k3n");
    server.use(http.get(`${baseUrl}/api/auth/me`, () => HttpResponse.json(aliceUser)));

    const { router } = renderRoutes(routes, "/");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });
});
