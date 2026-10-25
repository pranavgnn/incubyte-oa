import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-app.js";
import { signToken } from "../helpers/tokens.js";

async function registerUser(email: string, password: string) {
  const response = await request(buildApp()).post("/api/auth/register").send({ email, password });
  expect(response.status).toBe(201);
  return response.body as { token: string; user: { id: string; email: string; role: string } };
}

const AUTHENTICATION_REQUIRED = {
  error: { code: "UNAUTHORIZED", message: "Authentication required", details: [] },
};

const INVALID_TOKEN = {
  error: { code: "UNAUTHORIZED", message: "Invalid or expired token", details: [] },
};

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

  it("returns 401 Authentication required when there is no Authorization header", async () => {
    const response = await me();

    expect(response.status).toBe(401);
    expect(response.body).toEqual(AUTHENTICATION_REQUIRED);
  });

  it.each(["Basic YWxpY2U6c2VjcmV0", "Token abc.def.ghi", "Bearer"])(
    "returns 401 Authentication required when the header is not a bearer token: %s",
    async (authorization) => {
      const response = await me(authorization);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(AUTHENTICATION_REQUIRED);
    },
  );

  it.each([
    { label: "is not a JWT", token: async () => "not-a-jwt" },
    {
      label: "is signed with another secret",
      token: (sub: string) =>
        signToken({ sub, role: "user" }, { secret: "some-other-secret-at-least-32-characters" }),
    },
    {
      label: "has expired",
      token: (sub: string) =>
        signToken({ sub, role: "user" }, { expiresAt: Math.floor(Date.now() / 1000) - 60 }),
    },
  ])("returns 401 Invalid or expired token when the token $label", async ({ token }) => {
    const { user } = await registerUser("alice@example.com", "correct-horse");

    const response = await me(`Bearer ${await token(user.id)}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(INVALID_TOKEN);
  });
});
