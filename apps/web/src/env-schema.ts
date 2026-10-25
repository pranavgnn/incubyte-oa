export type Env = Readonly<{ VITE_API_URL: string }>;

export function parseEnv(source: Record<string, unknown>): Env {
  return Object.freeze({ VITE_API_URL: String(source.VITE_API_URL) });
}
