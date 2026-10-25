import { attachDatabasePool } from "@vercel/functions";
import type { Express } from "express";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createContainer } from "./container.js";

// Vercel entry: the platform owns the HTTP server, so this only builds the
// real container and default-exports the app. scripts/build.ts bundles it
// to dist/index.js, which is where Vercel looks for the entrypoint.
//
// Every Fluid instance holds its own pool, and Neon's pooled endpoint absorbs
// the fan-out, so a few connections per instance is enough. The short idle
// timeout lets attachDatabasePool close idle clients before the instance
// suspends, instead of leaving sockets for Neon's scale-to-zero to cut (the
// same failure class as the idle-client crash handled in db/client.ts).
const container = createContainer(env, { pool: { max: 5, idleTimeoutMillis: 5_000 } });
attachDatabasePool(container.pool);

const app: Express = createApp(container.deps);

export default app;
