import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function register(body: unknown) {
  return request(buildApp())
    .post("/api/auth/register")
    .send(body as object);
}

describe("POST /api/auth/register", () => {
  it("returns 201 with a token and the new user as id, email and role", async () => {
    const response = await register({ email: "alice@example.com", password: "correct-horse" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      token: expect.any(String),
      user: { id: expect.stringMatching(UUID), email: "alice@example.com", role: "user" },
    });
  });
});
