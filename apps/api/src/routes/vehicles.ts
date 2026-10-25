import { type RequestHandler, Router } from "express";

// Every vehicle and inventory route needs a signed-in caller, so
// authenticate guards the whole router.
export function vehicleRoutes(authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);
  return router;
}
