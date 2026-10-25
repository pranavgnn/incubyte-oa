import {
  createVehicleRequestSchema,
  purchaseRequestSchema,
  restockRequestSchema,
  updateVehicleRequestSchema,
  vehicleIdParamsSchema,
  vehicleSearchQuerySchema,
} from "@dealership/shared";
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
  router.put(
    "/:id",
    requireRole("admin"),
    validate({ params: vehicleIdParamsSchema, body: updateVehicleRequestSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    requireRole("admin"),
    validate({ params: vehicleIdParamsSchema }),
    controller.delete,
  );
  // Any signed-in caller may buy.
  router.post(
    "/:id/purchase",
    validate({ params: vehicleIdParamsSchema, body: purchaseRequestSchema }),
    controller.purchase,
  );
  router.post("/:id/restock", validate({ body: restockRequestSchema }), controller.restock);
  return router;
}
