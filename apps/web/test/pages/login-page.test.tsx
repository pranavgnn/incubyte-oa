import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { LoginPage } from "@/pages/login-page";
import { aliceUser, baseUrl, errorBody, Page, renderRoutes, setupUser } from "../helpers";
import { server } from "../msw/server";

function renderLogin(path = "/login") {
  return renderRoutes(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/", element: <Page title="Dashboard" /> },
    ],
    path,
  );
}

describe("LoginPage", () => {
  it("shows inline errors and sends nothing when the email is invalid and the password empty", async () => {
    renderLogin();
    const user = setupUser();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // MSW errors on any unhandled request, so no request was sent.
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Enter your password");
    expect(screen.getByLabelText("Email")).toHaveFocus();
  });

  it("signs in, goes to the page in next and welcomes the user", async () => {
    let received: unknown;
    server.use(
      http.post(`${baseUrl}/api/auth/login`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ token: "t0k3n", user: aliceUser });
      }),
    );
    const { router, tokens } = renderLogin("/login?next=%2F%3Fmake%3DTata");
    const user = setupUser();

    await user.type(screen.getByLabelText("Email"), "  Alice@Example.com ");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?make=Tata");
    expect(received).toEqual({ email: "alice@example.com", password: "correct horse" });
    expect(tokens.get()).toBe("t0k3n");
    expect(await screen.findByText("Welcome back, alice@example.com")).toBeInTheDocument();
  });

  it("ignores a next that points off-site", async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () =>
        HttpResponse.json({ token: "t0k3n", user: aliceUser }),
      ),
    );
    const { router } = renderLogin("/login?next=https%3A%2F%2Fevil.example");
    const user = setupUser();

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("shows an inline alert, not a toast or redirect, for wrong credentials", async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () =>
        HttpResponse.json(errorBody("UNAUTHORIZED", "invalid credentials"), { status: 401 }),
      ),
    );
    const { router, tokens } = renderLogin();
    const user = setupUser();

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.queryByText("Session expired — please sign in")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(tokens.get()).toBeNull();
  });

  it("puts server validation errors on their fields", async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () =>
        HttpResponse.json(
          errorBody("VALIDATION_ERROR", "Request validation failed", [
            { path: ["email"], message: "Email domain is not accepted" },
          ]),
          { status: 400 },
        ),
      ),
    );
    renderLogin();
    const user = setupUser();

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "Email domain is not accepted",
      ),
    );
  });

  it("shows other failures, such as a network error, in the inline alert", async () => {
    server.use(http.post(`${baseUrl}/api/auth/login`, () => HttpResponse.error()));
    renderLogin();
    const user = setupUser();

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network error — check your connection",
    );
  });

  it("disables the submit button and shows progress while signing in", async () => {
    let respond: () => void = () => {};
    server.use(
      http.post(
        `${baseUrl}/api/auth/login`,
        () =>
          new Promise<Response>((resolve) => {
            respond = () => resolve(HttpResponse.json({ token: "t0k3n", user: aliceUser }));
          }),
      ),
    );
    renderLogin();
    const user = setupUser();

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: /Signing in…/ })).toBeDisabled();
    respond();
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });
});
