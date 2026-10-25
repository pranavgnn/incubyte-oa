import express, { type Express } from "express";
import helmet from "helmet";
import type { HealthController } from "./controllers/health-controller.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { healthRoutes } from "./routes/health.js";

export type AppDeps = {
  healthController: HealthController;
};

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(helmet());
  app.use("/api/health", healthRoutes(deps.healthController));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
