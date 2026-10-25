import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { AuthController } from "./controllers/auth-controller.js";
import type { HealthController } from "./controllers/health-controller.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";

export type AppConfig = {
  webOrigin: string;
};

export type AppDeps = {
  config: AppConfig;
  authController: AuthController;
  healthController: HealthController;
};

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(helmet());
  // An array makes cors reflect the origin only on an exact match; a plain
  // string would send the configured origin to every caller.
  app.use(cors({ origin: [deps.config.webOrigin] }));
  app.use(express.json());
  app.use("/api/auth", authRoutes(deps.authController));
  app.use("/api/health", healthRoutes(deps.healthController));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
