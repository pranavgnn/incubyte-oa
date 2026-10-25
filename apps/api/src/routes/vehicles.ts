import { createVehicleRequestSchema, vehicleSearchQuerySchema } from "@dealership/shared";
import { type RequestHandler, Router } from "express";
import type { VehicleController } from "../controllers/vehicle-controller.js";
import { requireRole } from "../middleware/require-role.js";
import { validate } from "../middleware/validate.js";

// Every vehicle and inventory route needs a signed-in caller, so
// authenticate guards the whole router.
export function vehicleRoutes(controller: VehicleController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);
  router.get("/", controller.list);
  // Registered before any /:id route so "search" is never read as an id.
  router.get("/search", validate({ query: vehicleSearchQuerySchema }), controller.search);
  router.post(
    "/",
    requireRole("admin"),
    validate({ body: createVehicleRequestSchema }),
    controller.create,
  );
  return router;
}
