import { emailSchema } from "@dealership/shared";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  TEST_DATABASE_URL: z.url().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  WEB_ORIGIN: z.url(),
  // Only db:seed needs it, so the server and the Vercel function start
  // without it; the seed fails fast when it is missing.
  ADMIN_EMAIL: emailSchema.optional(),
});

export type Env = Readonly<z.infer<typeof envSchema>>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return Object.freeze(result.data);
}

// Integration tests truncate tables, so they must only ever touch a
// database that was explicitly named as the test database.
export function resolveTestDatabaseUrl(
  env: Pick<Env, "DATABASE_URL" | "TEST_DATABASE_URL">,
): string {
  if (!env.TEST_DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at the dedicated test database; tests never fall back to DATABASE_URL.",
    );
  }
  if (env.TEST_DATABASE_URL === env.DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL must differ from DATABASE_URL. Tests truncate tables and would wipe that database.",
    );
  }
  return env.TEST_DATABASE_URL;
}
