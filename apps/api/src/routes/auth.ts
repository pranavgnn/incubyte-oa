import { registerRequestSchema } from "@dealership/shared";
import { Router } from "express";
import type { AuthController } from "../controllers/auth-controller.js";
import { validate } from "../middleware/validate.js";

// Public: these routes are how a caller gets a token in the first place.
export function authRoutes(controller: AuthController): Router {
  const router = Router();
  router.post("/register", validate({ body: registerRequestSchema }), controller.register);
  return router;
}
