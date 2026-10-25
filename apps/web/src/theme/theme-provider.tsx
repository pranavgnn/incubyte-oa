import { createContext, type ReactNode, useContext, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "dealership.theme";

type ThemeContextValue = { theme: Theme; toggleTheme(): void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  storage: Storage;
  prefersDark: () => boolean;
  children: ReactNode;
};

export function ThemeProvider({ storage, prefersDark, children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => (prefersDark() ? "dark" : "light"));

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      storage.setItem(KEY, next);
    } catch {
      // Unavailable storage only means the choice is not remembered.
    }
  };

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}
