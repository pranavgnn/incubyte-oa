import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import request, { type Response } from "supertest";
import { describe, expect, it } from "vitest";
import { users } from "../../src/db/schema.js";
import { testDatabase } from "../db.js";
import { buildApp, TEST_JWT_SECRET } from "../helpers/build-app.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function storedPasswordHash(userId: string): Promise<string> {
  const { rows } = await testDatabase.pool.query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId],
  );
  return rows[0]?.password_hash ?? "";
}

async function storedEmail(userId: string): Promise<string | undefined> {
  const { rows } = await testDatabase.pool.query<{ email: string }>(
    "SELECT email FROM users WHERE id = $1",
    [userId],
  );
  return rows[0]?.email;
}

async function userCount(): Promise<number> {
  const { rows } = await testDatabase.pool.query<{ count: string }>("SELECT count(*) FROM users");
  return Number(rows[0]?.count);
}

function expectValidationError(response: Response, field: string) {
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [{ path: [field], message: expect.any(String) }],
    },
  });
}

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

  it("stores a bcrypt hash of the password with cost of at least 12, never the password itself", async () => {
    const response = await register({ email: "alice@example.com", password: "correct-horse" });

    const hash = await storedPasswordHash(response.body.user.id);
    expect(hash).not.toBe("correct-horse");
    expect(await bcrypt.compare("correct-horse", hash)).toBe(true);
    expect(bcrypt.getRounds(hash)).toBeGreaterThanOrEqual(12);
    expect(response.text).not.toContain(hash);
  });

  it("returns 400 VALIDATION_ERROR with the issue in details when the email is invalid", async () => {
    const response = await register({ email: "not-an-email", password: "correct-horse" });

    expectValidationError(response, "email");
    expect(await userCount()).toBe(0);
  });

  it("returns 400 VALIDATION_ERROR when the password is shorter than 8 characters", async () => {
    const response = await register({ email: "alice@example.com", password: "1234567" });

    expectValidationError(response, "password");
    expect(await userCount()).toBe(0);
  });

  it("returns 400 VALIDATION_ERROR when the password is over 72 bytes in UTF-8, even if under 72 characters", async () => {
    // 25 characters but 75 bytes: bcrypt would silently ignore everything past byte 72.
    const response = await register({ email: "alice@example.com", password: "€".repeat(25) });

    expectValidationError(response, "password");
    expect(await userCount()).toBe(0);
  });

  it("accepts a password of exactly 72 bytes", async () => {
    const response = await register({ email: "alice@example.com", password: "a".repeat(72) });

    expect(response.status).toBe(201);
  });

  it.each([
    { key: "role", value: "admin" },
    { key: "nickname", value: "al" },
  ])(
    "returns 400 VALIDATION_ERROR for the unknown key $key and creates no user",
    async ({ key, value }) => {
      const response = await register({
        email: "alice@example.com",
        password: "correct-horse",
        [key]: value,
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual([
        { path: [], message: expect.stringContaining(key) },
      ]);
      expect(await userCount()).toBe(0);
    },
  );

  it("trims and lowercases the email before storing and returning it", async () => {
    const response = await register({ email: "  Alice@Example.COM ", password: "correct-horse" });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("alice@example.com");
    expect(await storedEmail(response.body.user.id)).toBe("alice@example.com");
  });

  it("returns 409 CONFLICT when the email is already registered, ignoring case and whitespace", async () => {
    await register({ email: "alice@example.com", password: "correct-horse" });

    const response = await register({ email: " ALICE@example.com", password: "another-pass" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: { code: "CONFLICT", message: "Email is already registered", details: [] },
    });
    expect(await userCount()).toBe(1);
  });

  it("returns 409 when a row inserted without the schema (e.g. by the seed) differs only in case", async () => {
    // Straight to the database, skipping the Zod normalisation, as a seed script or manual SQL could.
    await testDatabase.db
      .insert(users)
      .values({ email: "Alice@Example.com", passwordHash: "not-a-real-hash" });

    const response = await register({ email: "alice@example.com", password: "correct-horse" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
    expect(await userCount()).toBe(1);
  });
});
