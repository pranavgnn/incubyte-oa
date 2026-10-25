import { createVehicleRequestSchema } from "@dealership/shared";
import { type RequestHandler, Router } from "express";
import type { VehicleController } from "../controllers/vehicle-controller.js";
import { validate } from "../middleware/validate.js";

// Every vehicle and inventory route needs a signed-in caller, so
// authenticate guards the whole router.
export function vehicleRoutes(controller: VehicleController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);
  router.get("/", controller.list);
  router.post("/", validate({ body: createVehicleRequestSchema }), controller.create);
  return router;
}
