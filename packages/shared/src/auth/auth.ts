import { z } from "zod";

export const roleSchema = z.enum(["user", "admin"]);

export type Role = z.infer<typeof roleSchema>;

// Normalised before the format check so stray whitespace or capitals
// never create a second account for the same mailbox, and every lookup
// compares against the form that was stored.
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

// bcrypt ignores everything after the first 72 bytes, so the limit is
// measured in UTF-8 bytes, not characters.
const MAX_PASSWORD_BYTES = 72;

export const registerRequestSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string()
    .min(8)
    .refine((password) => new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES, {
      message: `Password must be at most ${MAX_PASSWORD_BYTES} bytes`,
    }),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.strictObject({
  email: emailSchema,
  // Non-empty only. The register policy (length, byte cap) is not repeated
  // here, so a login attempt never learns what that policy is.
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

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
