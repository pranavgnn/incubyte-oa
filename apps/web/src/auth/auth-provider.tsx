import type { User } from "@dealership/shared";
import type { ReactNode } from "react";
import type { AuthApi } from "@/api/auth-api";
import type { TokenStorage } from "./token-storage";

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User };

type AuthProviderProps = {
  authApi: Pick<AuthApi, "me">;
  tokens: TokenStorage;
  children: ReactNode;
};

export function AuthProvider(_props: AuthProviderProps): ReactNode {
  throw new Error("not implemented");
}

export function useAuth(): { state: AuthState } {
  throw new Error("not implemented");
}
