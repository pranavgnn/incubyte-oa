import { createContext, type ReactNode, useContext } from "react";
import type { AuthApi } from "./auth-api";

export type Api = { authApi: AuthApi };

const ApiContext = createContext<Api | null>(null);

// Hands the API modules built in the composition root to the pages.
export function ApiProvider({ api, children }: { api: Api; children: ReactNode }) {
  return <ApiContext value={api}>{children}</ApiContext>;
}

export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi must be used inside <ApiProvider>");
  return api;
}
