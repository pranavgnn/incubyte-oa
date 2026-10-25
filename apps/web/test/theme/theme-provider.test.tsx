import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "@/theme/theme-provider";

afterEach(() => document.documentElement.classList.remove("dark"));

function ToggleProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  );
}

function renderTheme(prefersDark: boolean) {
  render(
    <ThemeProvider storage={localStorage} prefersDark={() => prefersDark}>
      <ToggleProbe />
    </ThemeProvider>,
  );
}

describe("ThemeProvider", () => {
  it("follows the system setting when no theme was chosen", () => {
    renderTheme(true);

    expect(document.documentElement).toHaveClass("dark");
  });

  it("toggles the theme and remembers the choice", async () => {
    renderTheme(false);

    await userEvent.click(screen.getByRole("button", { name: "light" }));

    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("dealership.theme")).toBe("dark");
  });
});
