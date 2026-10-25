import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RegisterPage } from "@/pages/register-page";
import { Page, renderRoutes } from "../helpers";

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
});
