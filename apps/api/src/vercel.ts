import type { Express } from "express";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createContainer } from "./container.js";

// Vercel entry: the platform owns the HTTP server, so this only builds the
// real container and default-exports the app. scripts/build.ts bundles it
// to dist/index.js, which is where Vercel looks for the entrypoint.
const app: Express = createApp(createContainer(env).deps);

export default app;
