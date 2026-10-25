import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";

async function registerUser(email: string, password: string) {
  const response = await request(buildApp()).post("/api/auth/register").send({ email, password });
  expect(response.status).toBe(201);
  return response.body as { token: string; user: { id: string; email: string; role: string } };
}

function me(authorization?: string) {
  const req = request(buildApp()).get("/api/auth/me");
  return authorization === undefined ? req : req.set("Authorization", authorization);
}

describe("GET /api/auth/me", () => {
  it("returns 200 with the current user as id, email and role for a valid bearer token", async () => {
    const { token, user } = await registerUser("alice@example.com", "correct-horse");

    const response = await me(`Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: user.id, email: "alice@example.com", role: "user" });
  });
});
