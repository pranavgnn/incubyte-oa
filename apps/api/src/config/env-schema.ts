import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url(),
  TEST_DATABASE_URL: z.url().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),
  WEB_ORIGIN: z.url(),
});

export type Env = Readonly<z.infer<typeof envSchema>>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}
