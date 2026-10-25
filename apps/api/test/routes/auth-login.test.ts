import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import request, { type Response } from "supertest";
import { describe, expect, it } from "vitest";
import { users } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp, TEST_JWT_SECRET } from "../helpers/build-app.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Identical for unknown email and wrong password, so a caller cannot
// tell which emails are registered.
const INVALID_CREDENTIALS = {
  error: { code: "UNAUTHORIZED", message: "Invalid credentials", details: [] },
};

async function registerUser(email: string, password: string) {
  const response = await request(buildApp()).post("/api/auth/register").send({ email, password });
  expect(response.status).toBe(201);
  return response.body.user as { id: string; email: string; role: string };
}

function expectValidationError(response: Response, path: string[]) {
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [{ path, message: expect.any(String) }],
    },
  });
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

  it("signs the token with JWT_SECRET, carrying the user id and role", async () => {
    const user = await registerUser("alice@example.com", "correct-horse");

    const response = await login({ email: "alice@example.com", password: "correct-horse" });

    const { payload } = await jwtVerify(
      response.body.token,
      new TextEncoder().encode(TEST_JWT_SECRET),
      { algorithms: ["HS256"] },
    );
    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe("user");
  });

  it("returns 401 UNAUTHORIZED with a generic message when the password is wrong", async () => {
    await registerUser("alice@example.com", "correct-horse");

    const response = await login({ email: "alice@example.com", password: "wrong-horse" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(INVALID_CREDENTIALS);
  });

  it("returns the same 401 Invalid credentials when the email is not registered", async () => {
    const response = await login({ email: "nobody@example.com", password: "correct-horse" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(INVALID_CREDENTIALS);
  });

  it("trims and lowercases the email, like register does", async () => {
    await registerUser("alice@example.com", "correct-horse");

    const response = await login({ email: "  Alice@Example.COM ", password: "correct-horse" });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("alice@example.com");
  });

  it("finds a user whose row was stored with capitals, bypassing the schema (e.g. by the seed)", async () => {
    await testDatabase.db.insert(users).values({
      email: "Alice@Example.com",
      passwordHash: await bcrypt.hash("correct-horse", 4),
    });

    const response = await login({ email: "alice@example.com", password: "correct-horse" });

    expect(response.status).toBe(200);
  });

  it("returns 400 VALIDATION_ERROR when the email is invalid", async () => {
    const response = await login({ email: "not-an-email", password: "correct-horse" });

    expectValidationError(response, ["email"]);
  });

  it("returns 400 VALIDATION_ERROR when the password is empty", async () => {
    const response = await login({ email: "alice@example.com", password: "" });

    expectValidationError(response, ["password"]);
  });

  it.each([
    { label: "shorter than the register minimum", password: "abc" },
    { label: "over the 72-byte register cap", password: "â‚¬".repeat(30) },
  ])(
    "answers a wrong password $label with 401, not 400, so the password policy is not revealed",
    async ({ password }) => {
      await registerUser("alice@example.com", "correct-horse");

      const response = await login({ email: "alice@example.com", password });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(INVALID_CREDENTIALS);
    },
  );

  it.each([
    { key: "role", value: "admin" },
    { key: "remember", value: true },
  ])("returns 400 VALIDATION_ERROR for the unknown key $key", async ({ key, value }) => {
    await registerUser("alice@example.com", "correct-horse");

    const response = await login({
      email: "alice@example.com",
      password: "correct-horse",
      [key]: value,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toEqual([
      { path: [], message: expect.stringContaining(key) },
    ]);
  });
});
