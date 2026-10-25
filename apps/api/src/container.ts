import type { PoolConfig } from "pg";
import type { AppDeps } from "./app.js";
import type { Env } from "./config/env-schema.js";
import { HealthController } from "./controllers/health-controller.js";
import { createDb } from "./db/client.js";
import { DrizzleHealthRepository } from "./repositories/drizzle-health-repository.js";
import { HealthService } from "./services/health-service.js";

export type ContainerOptions = {
  pool?: Omit<PoolConfig, "connectionString">;
};

// Composition root: the only place that instantiates concrete classes.
export function createContainer(env: Env, options: ContainerOptions = {}) {
  const { db, pool } = createDb(env.DATABASE_URL, options.pool);

  const deps: AppDeps = {
    config: { webOrigin: env.WEB_ORIGIN },
    healthController: new HealthController(new HealthService(new DrizzleHealthRepository(db))),
  };

  return { deps, pool, close: () => pool.end() };
}
