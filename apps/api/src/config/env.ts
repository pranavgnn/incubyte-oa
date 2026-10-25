import { parseEnv } from "./env-schema.js";

// The only place in the API that reads process.env. Everything else
// receives config through the container.
export const env = parseEnv(process.env);
