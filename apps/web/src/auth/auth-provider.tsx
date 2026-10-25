import type { AuthResponse, User } from "@dealership/shared";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { AuthApi } from "@/api/auth-api";
import { ApiError } from "@/api/errors";
import type { TokenStorage } from "./token-storage";

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User };

type AuthContextValue = {
  state: AuthState;
  signIn(session: AuthResponse): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  authApi: Pick<AuthApi, "me">;
  tokens: TokenStorage;
  children: ReactNode;
};

export function AuthProvider({ authApi, tokens, children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() =>
    tokens.get() ? { status: "loading" } : { status: "signed-out" },
  );
  const restoring = state.status === "loading";

  useEffect(() => {
    if (!restoring) return;
    let cancelled = false;
    authApi.me().then(
      (user) => {
        if (!cancelled) setState({ status: "signed-in", user });
      },
      (error: unknown) => {
        // Only a 401 proves the token is dead; a network blip keeps it
        // so the next load can try again.
        if (error instanceof ApiError && error.status === 401) tokens.clear();
        if (!cancelled) setState({ status: "signed-out" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [restoring, authApi, tokens]);

  const signIn = (_session: AuthResponse) => {
    throw new Error("not implemented");
  };

  return <AuthContext value={{ state, signIn }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
