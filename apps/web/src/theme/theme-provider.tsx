import { type ReactNode, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark";

type ThemeProviderProps = {
  storage: Storage;
  prefersDark: () => boolean;
  children: ReactNode;
};

export function ThemeProvider({ prefersDark, children }: ThemeProviderProps) {
  const [theme] = useState<Theme>(() => (prefersDark() ? "dark" : "light"));

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return children;
}

export function useTheme(): { theme: Theme; toggleTheme(): void } {
  throw new Error("not implemented");
}
