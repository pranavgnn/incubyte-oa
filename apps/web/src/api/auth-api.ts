import type { AuthResponse } from "@dealership/shared";
import type { ApiClient } from "./client";

export type Credentials = { email: string; password: string };

export function createAuthApi(_client: ApiClient) {
  return {
    register(_credentials: Credentials): Promise<AuthResponse> {
      throw new Error("not implemented");
    },
  };
}
