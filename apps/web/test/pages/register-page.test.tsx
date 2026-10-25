import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { RegisterPage } from "@/pages/register-page";
import { aliceUser, baseUrl, errorBody, Page, renderRoutes } from "../helpers";
import { server } from "../msw/server";

function renderRegister(path = "/register") {
  return renderRoutes(
    [
      { path: "/register", element: <RegisterPage /> },
      { path: "/", element: <Page title="Dashboard" /> },
    ],
    path,
  );
}

describe("RegisterPage", () => {
  it("states the password rules and checks them, and the confirmation, before sending", async () => {
    renderRegister();
    const user = userEvent.setup();

    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 8 characters, up to 72 bytes.",
    );

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    // MSW errors on any unhandled request, so no request was sent.
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 8 characters, up to 72 bytes. Use at least 8 characters",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAccessibleDescription(
      "Passwords don't match",
    );
  });

  it("creates the account with only email and password, then signs in and goes to next", async () => {
    let received: unknown;
    server.use(
      http.post(`${baseUrl}/api/auth/register`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ token: "t0k3n", user: aliceUser }, { status: 201 });
      }),
    );
    const { router, tokens } = renderRegister("/register?next=%2F%3Fq%3Dnex");
    const user = userEvent.setup();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?q=nex");
    expect(received).toEqual({ email: "alice@example.com", password: "correct horse" });
    expect(tokens.get()).toBe("t0k3n");
    expect(
      await screen.findByText("Account created — signed in as alice@example.com"),
    ).toBeInTheDocument();
  });

  it("marks the email field when the account already exists", async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/register`, () =>
        HttpResponse.json(errorBody("CONFLICT", "Email is already registered"), { status: 409 }),
      ),
    );
    const { tokens } = renderRegister();
    const user = userEvent.setup();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "An account with this email already exists",
      ),
    );
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(tokens.get()).toBeNull();
  });

  it("puts server validation errors on their fields", async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/register`, () =>
        HttpResponse.json(
          errorBody("VALIDATION_ERROR", "Request validation failed", [
            { path: ["password"], message: "Password must be at most 72 bytes" },
          ]),
          { status: 400 },
        ),
      ),
    );
    renderRegister();
    const user = userEvent.setup();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
        "At least 8 characters, up to 72 bytes. Password must be at most 72 bytes",
      ),
    );
  });

  it("disables the submit button and shows progress while creating the account", async () => {
    let respond: () => void = () => {};
    server.use(
      http.post(
        `${baseUrl}/api/auth/register`,
        () =>
          new Promise<Response>((resolve) => {
            respond = () =>
              resolve(HttpResponse.json({ token: "t0k3n", user: aliceUser }, { status: 201 }));
          }),
      ),
    );
    renderRegister();
    const user = userEvent.setup();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("button", { name: /Creating account…/ })).toBeDisabled();
    respond();
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });
});

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.type(screen.getByLabelText("Password"), "correct horse");
  await user.type(screen.getByLabelText("Confirm password"), "correct horse");
}
