import type { Express } from "express";
import type { HealthController } from "./controllers/health-controller.js";

export type AppDeps = {
  healthController: HealthController;
};

export function createApp(_deps: AppDeps): Express {
  throw new Error("not implemented");
}
