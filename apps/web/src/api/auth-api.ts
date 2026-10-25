import { type AuthResponse, authResponseSchema } from "@dealership/shared";
import type { ApiClient } from "./client";
import { type MeResponse, meResponseSchema } from "./contracts";

export type Credentials = { email: string; password: string };

export function createAuthApi(client: ApiClient) {
  return {
    // Picks the two fields explicitly: the API schema is strict, and form
    // values can carry more (confirmPassword).
    register({ email, password }: Credentials): Promise<AuthResponse> {
      return client.request("/api/auth/register", {
        method: "POST",
        body: { email, password },
        anonymous: true,
        schema: authResponseSchema,
      });
    },

    login({ email, password }: Credentials): Promise<AuthResponse> {
      return client.request("/api/auth/login", {
        method: "POST",
        body: { email, password },
        anonymous: true,
        schema: authResponseSchema,
      });
    },

    me(): Promise<MeResponse> {
      return client.request("/api/auth/me", { schema: meResponseSchema });
    },
  };
}
export type AuthApi = ReturnType<typeof createAuthApi>;
