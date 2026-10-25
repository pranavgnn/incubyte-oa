import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      // Worker threads start faster than the default forked processes.
      pool: "threads",
      // Tailwind and the font stylesheets are not needed to query the DOM
      // by role and label, so CSS imports resolve to empty strings.
      css: false,
      include: ["test/**/*.test.{ts,tsx}"],
      setupFiles: ["test/setup.ts"],
      // Tests build their own config through the same env schema as the app.
      env: {
        VITE_API_URL: "http://api.test",
      },
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        // Generated shadcn primitives and the bootstrap entry; all app
        // logic stays measured.
        exclude: ["src/components/ui/**", "src/main.tsx"],
        reporter: ["text", "html", "lcov"],
        thresholds: {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 80,
        },
      },
    },
  }),
);
