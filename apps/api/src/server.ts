import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createContainer } from "./container.js";

const container = createContainer(env);
const server = createApp(container.deps).listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(() => {
    void container.close();
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
