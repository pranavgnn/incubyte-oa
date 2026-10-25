import { Router } from "express";
import type { HealthController } from "../controllers/health-controller.js";

// Public on purpose: deploy checks call it without credentials.
export function healthRoutes(controller: HealthController): Router {
  const router = Router();
  router.get("/", controller.check);
  return router;
}
