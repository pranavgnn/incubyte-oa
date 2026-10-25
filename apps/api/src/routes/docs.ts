import { Router } from "express";

// Public API reference. The document is built once at startup and served
// as-is, so this route never touches the database.
export function docsRoutes(document: object): Router {
  const router = Router();
  router.get("/openapi.json", (_req, res) => {
    res.json(document);
  });
  return router;
}
