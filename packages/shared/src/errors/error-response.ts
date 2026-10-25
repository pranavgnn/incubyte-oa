import { z } from "zod";

// The only shape any non-2xx API response uses.
export const errorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
