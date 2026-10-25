import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LoginPage } from "@/pages/login-page";
import { Page, renderRoutes } from "../helpers";

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
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // MSW errors on any unhandled request, so no request was sent.
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Enter your password");
    expect(screen.getByLabelText("Email")).toHaveFocus();
  });
});
