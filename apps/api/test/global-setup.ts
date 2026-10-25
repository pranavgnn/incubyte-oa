import type { TestProject } from "vitest/node";
import { resolveTestDatabaseUrl } from "../src/config/env-schema.js";
import { migrateDatabase } from "../src/db/migrator.js";

declare module "vitest" {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

export default async function setup(project: TestProject) {
  try {
    // Imported lazily so a bad env surfaces as a readable error here.
    const { env } = await import("../src/config/env.js");
    // Throws before any connection is opened if the URL is missing or unsafe.
    const testDatabaseUrl = resolveTestDatabaseUrl(env);
    await migrateDatabase(testDatabaseUrl);
    project.provide("testDatabaseUrl", testDatabaseUrl);
  } catch (error) {
    // Vitest's startup error printer can crash while source-mapping
    // errors thrown here, so print the reason before rethrowing.
    console.error(`\nTest database setup failed:\n${describe(error)}\n`);
    throw error;
  }
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (!(error.cause instanceof Error)) return error.message;
  // pg connection failures are AggregateErrors with an empty message but a code.
  const cause = error.cause as Error & { code?: string };
  return `${error.message}\nCaused by: ${cause.message || cause.code || cause.name}`;
}
