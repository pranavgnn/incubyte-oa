import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function registerUser(email: string, password: string) {
  const response = await request(buildApp()).post("/api/auth/register").send({ email, password });
  expect(response.status).toBe(201);
  return response.body.user as { id: string; email: string; role: string };
}

function login(body: unknown) {
  return request(buildApp())
    .post("/api/auth/login")
    .send(body as object);
}

describe("POST /api/auth/login", () => {
  it("returns 200 with a token and the user as id, email and role for correct credentials", async () => {
    const user = await registerUser("alice@example.com", "correct-horse");

    const response = await login({ email: "alice@example.com", password: "correct-horse" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: expect.any(String),
      user: { id: expect.stringMatching(UUID), email: "alice@example.com", role: "user" },
    });
    expect(response.body.user.id).toBe(user.id);
  });
});
