import { type AuthResponse, authResponseSchema } from "@dealership/shared";
import type { ApiClient } from "./client";

export type Credentials = { email: string; password: string };

export function createAuthApi(client: ApiClient) {
  return {
    // Picks the two fields explicitly: the API schema is strict, and form
    // values can carry more (confirmPassword).
    register({ email, password }: Credentials): Promise<AuthResponse> {
      return client.request("/api/auth/register", {
        method: "POST",
        body: { email, password },
        schema: authResponseSchema,
      });
    },

    login(_credentials: Credentials): Promise<AuthResponse> {
      throw new Error("not implemented");
    },
  };
}
