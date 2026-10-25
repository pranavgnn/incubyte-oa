import { jwtVerify } from "jose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp, TEST_JWT_SECRET } from "../helpers/build-app.js";

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

  it("signs the token with JWT_SECRET, carrying the user id, role and a 15 minute expiry", async () => {
    const response = await register({ email: "alice@example.com", password: "correct-horse" });

    const { payload, protectedHeader } = await jwtVerify(
      response.body.token,
      new TextEncoder().encode(TEST_JWT_SECRET),
      { algorithms: ["HS256"] },
    );
    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe(response.body.user.id);
    expect(payload.role).toBe("user");
    expect(payload.exp).toBe((payload.iat ?? 0) + 15 * 60);
  });
});
