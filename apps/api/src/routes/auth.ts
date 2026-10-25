import { loginRequestSchema, registerRequestSchema } from "@dealership/shared";
import { type RequestHandler, Router } from "express";
import type { AuthController } from "../controllers/auth-controller.js";
import { validate } from "../middleware/validate.js";

// register and login are public: they are how a caller gets a token in
// the first place. me needs one.
export function authRoutes(controller: AuthController, authenticate: RequestHandler): Router {
  const router = Router();
  router.post("/register", validate({ body: registerRequestSchema }), controller.register);
  router.post("/login", validate({ body: loginRequestSchema }), controller.login);
  router.get("/me", authenticate, controller.me);
  return router;
}
