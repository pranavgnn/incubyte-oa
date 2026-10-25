import type { User } from "@dealership/shared";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { AuthApi } from "@/api/auth-api";
import type { TokenStorage } from "./token-storage";

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User };

type AuthContextValue = { state: AuthState };

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  authApi: Pick<AuthApi, "me">;
  tokens: TokenStorage;
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state] = useState<AuthState>({ status: "signed-out" });
  return <AuthContext value={{ state }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
