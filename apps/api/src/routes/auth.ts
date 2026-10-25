import { Router } from "express";
import type { AuthController } from "../controllers/auth-controller.js";

// Public: these routes are how a caller gets a token in the first place.
export function authRoutes(controller: AuthController): Router {
  const router = Router();
  router.post("/register", controller.register);
  return router;
}
