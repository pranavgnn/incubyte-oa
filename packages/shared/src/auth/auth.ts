import { z } from "zod";

export const roleSchema = z.enum(["user", "admin"]);

export type Role = z.infer<typeof roleSchema>;

// bcrypt ignores everything after the first 72 bytes, so the limit is
// measured in UTF-8 bytes, not characters.
const MAX_PASSWORD_BYTES = 72;

export const registerRequestSchema = z.strictObject({
  // Normalised before the format check so stray whitespace or capitals
  // never create a second account for the same mailbox.
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8)
    .refine((password) => new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES, {
      message: `Password must be at most ${MAX_PASSWORD_BYTES} bytes`,
    }),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  // Same normalisation as register, so the lookup matches the stored email.
  email: z.string().trim().toLowerCase(),
  password: z.string(),
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
