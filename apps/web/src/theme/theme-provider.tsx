import type { ReactNode } from "react";

export type Theme = "light" | "dark";

type ThemeProviderProps = {
  storage: Storage;
  prefersDark: () => boolean;
  children: ReactNode;
};

export function ThemeProvider(_props: ThemeProviderProps): ReactNode {
  throw new Error("not implemented");
}
