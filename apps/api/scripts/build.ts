import { readFileSync } from "node:fs";
import { build } from "esbuild";

// Bundles the Vercel entry into a single ESM file. Workspace packages
// (e.g. @dealership/shared, which exports raw .ts) are inlined; npm
// dependencies stay external so Vercel installs and traces them normally.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  dependencies?: Record<string, string>;
};
const external = Object.entries(pkg.dependencies ?? {})
  .filter(([, version]) => !version.startsWith("workspace:"))
  .map(([name]) => name);

await build({
  entryPoints: ["src/vercel.ts"],
  outfile: "dist/index.js",
  bundle: true,
  packages: "bundle",
  external,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  logLevel: "info",
});
