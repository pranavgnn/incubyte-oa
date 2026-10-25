import { randomBytes } from "node:crypto";
import { apiReference } from "@scalar/express-api-reference";
import { type RequestHandler, type Response, Router } from "express";
import helmet from "helmet";

// Pinned so the docs page does not change under us when Scalar publishes.
const SCALAR_CDN = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.73.1";

const assignNonce: RequestHandler = (_req, res, next) => {
  res.locals.cspNonce = randomBytes(16).toString("base64");
  next();
};

// Replaces the global helmet policy on this route only. Scripts stay
// strict: only tags carrying this response's nonce run, which covers
// Scalar's CDN bundle and its inline bootstrap without allowing every
// inline script. Images may come from any https host because the spec
// can link logos; everything else keeps helmet's defaults (styles already
// allow 'unsafe-inline', which Scalar's style attributes need).
const docsContentSecurityPolicy = helmet.contentSecurityPolicy({
  directives: {
    scriptSrc: ["'self'", (_req, res) => `'nonce-${(res as Response).locals.cspNonce}'`],
    imgSrc: ["'self'", "data:", "https:"],
  },
});

// Scalar takes the nonce as configuration, so the handler is built per
// request. Its typings declare a route without params, hence the cast.
const renderReference: RequestHandler = (req, res, next) => {
  const render = apiReference({
    url: "/api/openapi.json",
    pageTitle: "Car Dealership API",
    cdn: SCALAR_CDN,
    nonce: res.locals.cspNonce,
  }) as RequestHandler;
  render(req, res, next);
};

// Public API reference. The document is built once at startup and served
// as-is, so these routes never touch the database.
export function docsRoutes(document: object): Router {
  const router = Router();
  router.get("/openapi.json", (_req, res) => {
    res.json(document);
  });
  router.get("/docs", assignNonce, docsContentSecurityPolicy, renderReference);
  return router;
}
