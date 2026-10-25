import { createApp } from "../../src/app.js";
import { HealthController } from "../../src/controllers/health-controller.js";
import { DrizzleHealthRepository } from "../../src/repositories/drizzle-health-repository.js";
import { type HealthRepository, HealthService } from "../../src/services/health-service.js";
import { testDatabase } from "../db.js";

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
    healthController: new HealthController(healthService),
  });
}
