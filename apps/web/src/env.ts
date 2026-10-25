import { parseEnv } from "./env-schema";

// The only place in the web app that reads import.meta.env. Everything
// else receives config as arguments.
export const env = parseEnv(import.meta.env);
