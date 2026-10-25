export type Env = Readonly<{ VITE_API_URL: string }>;

export function parseEnv(_source: Record<string, unknown>): Env {
  throw new Error("not implemented");
}
