export type Env = Readonly<{
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  DATABASE_URL: string;
  TEST_DATABASE_URL?: string | undefined;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  WEB_ORIGIN: string;
}>;

export function parseEnv(_source: Record<string, string | undefined>): Env {
  throw new Error("not implemented");
}
