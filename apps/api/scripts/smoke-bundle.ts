import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";
import { errorResponseSchema } from "@dealership/shared";
import type { Express } from "express";

// Loads the built bundle exactly as Vercel will and proves it serves a
// request, so a broken bundle fails CI instead of the deploy. The probe
// hits an unknown route, which needs no database.
const bundle = pathToFileURL("dist/index.js").href;
const { default: exported } = (await import(bundle)) as { default: unknown };

assert.equal(typeof exported, "function", "dist/index.js must default-export an Express app");
for (const method of ["use", "handle", "listen"]) {
  assert.equal(
    typeof (exported as Record<string, unknown>)[method],
    "function",
    `default export is missing app.${method}()`,
  );
}
const app = exported as Express;

const server = app.listen(0);
await once(server, "listening");
try {
  const { port } = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/api/__smoke__`);
  assert.equal(response.status, 404);
  const body = errorResponseSchema.parse(await response.json());
  assert.equal(body.error.code, "NOT_FOUND");
} finally {
  server.close();
}

console.log("Bundle smoke check passed: dist/index.js serves requests.");
