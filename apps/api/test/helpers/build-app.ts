import { createApp } from "../../src/app.js";
import { AuthController } from "../../src/controllers/auth-controller.js";
import { HealthController } from "../../src/controllers/health-controller.js";
import { DrizzleHealthRepository } from "../../src/repositories/drizzle-health-repository.js";
import { DrizzleUserRepository } from "../../src/repositories/drizzle-user-repository.js";
import { AuthService } from "../../src/services/auth-service.js";
import { type HealthRepository, HealthService } from "../../src/services/health-service.js";
import { testDatabase } from "../db.js";

export const TEST_WEB_ORIGIN = "http://localhost:5173";

type Overrides = {
  healthRepository?: HealthRepository;
  healthService?: HealthService;
};

// Mirrors container.ts, but wired to the test database by default and
// letting a test swap in a fake repository or service.
export function buildApp(overrides: Overrides = {}) {
  const healthRepository =
    overrides.healthRepository ?? new DrizzleHealthRepository(testDatabase.db);
  const healthService = overrides.healthService ?? new HealthService(healthRepository);
  return createApp({
    config: { webOrigin: TEST_WEB_ORIGIN },
    authController: new AuthController(new AuthService(new DrizzleUserRepository(testDatabase.db))),
    healthController: new HealthController(healthService),
  });
}
