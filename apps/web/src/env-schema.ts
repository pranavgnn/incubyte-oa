import { z } from "zod";

export const envSchema = z.object({
  // Origin of the API, e.g. http://localhost:3000. Paths add /api/...
  VITE_API_URL: z.url({ protocol: /^https?$/ }),
});

export type Env = Readonly<z.infer<typeof envSchema>>;

export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return Object.freeze(result.data);
}
