import type { PoolConfig } from "pg";
import type { AppDeps } from "./app.js";
import type { Env } from "./config/env-schema.js";
import { AuthController } from "./controllers/auth-controller.js";
import { HealthController } from "./controllers/health-controller.js";
import { createDb } from "./db/client.js";
import { DrizzleHealthRepository } from "./repositories/drizzle-health-repository.js";
import { DrizzleUserRepository } from "./repositories/drizzle-user-repository.js";
import { AuthService } from "./services/auth-service.js";
import { BcryptPasswordHasher } from "./services/bcrypt-password-hasher.js";
import { HealthService } from "./services/health-service.js";
import { JoseTokenIssuer } from "./services/jose-token-issuer.js";
import { JoseTokenVerifier } from "./services/jose-token-verifier.js";

export type ContainerOptions = {
  pool?: Omit<PoolConfig, "connectionString">;
};

// Composition root: the only place that instantiates concrete classes.
export function createContainer(env: Env, options: ContainerOptions = {}) {
  const { db, pool } = createDb(env.DATABASE_URL, options.pool);

  const deps: AppDeps = {
    config: { webOrigin: env.WEB_ORIGIN },
    authController: new AuthController(
      new AuthService(
        new DrizzleUserRepository(db),
        new BcryptPasswordHasher(),
        new JoseTokenIssuer(env.JWT_SECRET, env.JWT_EXPIRES_IN),
      ),
    ),
    healthController: new HealthController(new HealthService(new DrizzleHealthRepository(db))),
    tokenVerifier: new JoseTokenVerifier(env.JWT_SECRET),
  };

  return { deps, pool, close: () => pool.end() };
}
