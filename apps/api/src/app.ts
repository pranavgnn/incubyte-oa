import express, { type Express } from "express";
import type { HealthController } from "./controllers/health-controller.js";
import { healthRoutes } from "./routes/health.js";

export type AppDeps = {
  healthController: HealthController;
};

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use("/api/health", healthRoutes(deps.healthController));
  return app;
}
