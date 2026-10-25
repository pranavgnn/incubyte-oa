import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { AuthController } from "./controllers/auth-controller.js";
import type { HealthController } from "./controllers/health-controller.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { vehicleRoutes } from "./routes/vehicles.js";
import type { TokenVerifier } from "./services/auth-service.js";

export type AppConfig = {
  webOrigin: string;
};

export type AppDeps = {
  config: AppConfig;
  authController: AuthController;
  healthController: HealthController;
  tokenVerifier: TokenVerifier;
};

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(helmet());
  // An array makes cors reflect the origin only on an exact match; a plain
  // string would send the configured origin to every caller.
  app.use(cors({ origin: [deps.config.webOrigin] }));
  // Every request body in this API is a small JSON object; a tight limit
  // keeps oversized payloads from tying up the parser.
  app.use(express.json({ limit: "10kb" }));
  const requireAuth = authenticate(deps.tokenVerifier);
  app.use("/api/auth", authRoutes(deps.authController, requireAuth));
  app.use("/api/vehicles", vehicleRoutes(requireAuth));
  app.use("/api/health", healthRoutes(deps.healthController));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
