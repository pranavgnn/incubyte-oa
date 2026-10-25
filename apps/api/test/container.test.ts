import bcrypt from "bcryptjs";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createContainer } from "../src/container.js";
import { testDatabase } from "./db.js";
import { TEST_JWT_SECRET, TEST_WEB_ORIGIN } from "./helpers/build-app.js";

let close: (() => Promise<void>) | undefined;

afterEach(async () => {
  await close?.();
  close = undefined;
});

describe("createContainer", () => {
  // Every other test wires a cheap hasher, so this is the one place that
  // proves production stores passwords at cost 12.
  it("stores registered passwords as bcrypt hashes at cost 12", async () => {
    const container = createContainer({
      NODE_ENV: "test",
      PORT: 0,
      DATABASE_URL: testDatabase.pool.options.connectionString ?? "",
      JWT_SECRET: TEST_JWT_SECRET,
      JWT_EXPIRES_IN: "15m",
      WEB_ORIGIN: TEST_WEB_ORIGIN,
    });
    close = container.close;

    const response = await request(createApp(container.deps))
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "correct-horse" });

    expect(response.status).toBe(201);
    const { rows } = await testDatabase.pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE email = 'alice@example.com'",
    );
    expect(bcrypt.getRounds(rows[0]?.password_hash ?? "")).toBe(12);
  });
});
