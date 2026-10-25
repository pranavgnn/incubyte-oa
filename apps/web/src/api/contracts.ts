// TEMPORARY: local mirror of contracts the API is still adding. Delete
// this file and import from @dealership/shared once feat/auth-login
// (login and GET /api/auth/me) is merged into main.
import { userSchema } from "@dealership/shared";
import { z } from "zod";

// POST /api/auth/login. Only presence is checked: a wrong password of any
// length is the API's "invalid credentials", not a client-side rule.
export const loginRequestSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

// GET /api/auth/me: the user behind a valid token, 401 otherwise.
export const meResponseSchema = userSchema;

export type MeResponse = z.infer<typeof meResponseSchema>;
