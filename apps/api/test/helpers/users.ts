import { type AuthResponse, authResponseSchema } from "@dealership/shared";
import request from "supertest";
import { expect } from "vitest";
import { buildApp } from "./build-app.js";

// Registers through the real endpoint, so tests get a user and a token
// exactly as a client would.
export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const response = await request(buildApp()).post("/api/auth/register").send({ email, password });
  expect(response.status).toBe(201);
  return authResponseSchema.parse(response.body);
}
