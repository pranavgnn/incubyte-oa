import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Load a local .env into the main process so globalSetup sees it and
// forked workers inherit it. Variables already set (e.g. in CI) win.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Integration tests share one Postgres test database.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Entry points and wiring only; all real logic stays measured.
      exclude: ["src/server.ts", "src/container.ts", "src/db/migrate.ts", "src/db/seed.ts"],
      reporter: ["text", "html", "lcov"],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 85,
      },
    },
  },
});
