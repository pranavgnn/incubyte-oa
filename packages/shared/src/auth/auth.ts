import { z } from "zod";

export const roleSchema = z.enum(["user", "admin"]);

export type Role = z.infer<typeof roleSchema>;

export const registerRequestSchema = z.strictObject({
  email: z.string(),
  password: z.string(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

// The public view of a user. The password hash never appears here.
export const userSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  role: roleSchema,
});

export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.strictObject({
  token: z.string(),
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
