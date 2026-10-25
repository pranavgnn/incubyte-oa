import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RequireAuth } from "@/auth/require-auth";
import { Page, renderRoutes } from "../helpers";

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
});
