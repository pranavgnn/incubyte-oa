import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "@/theme/theme-provider";

afterEach(() => document.documentElement.classList.remove("dark"));

describe("ThemeProvider", () => {
  it("follows the system setting when no theme was chosen", () => {
    render(
      <ThemeProvider storage={localStorage} prefersDark={() => true}>
        <p>app</p>
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveClass("dark");
  });
});
