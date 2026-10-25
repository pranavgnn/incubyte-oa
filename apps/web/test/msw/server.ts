import { setupServer } from "msw/node";

// Every test registers the handlers it needs with server.use().
export const server = setupServer();
