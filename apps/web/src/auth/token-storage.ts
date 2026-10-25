export type TokenStorage = {
  get(): string | null;
  set(token: string): void;
  clear(): void;
};

const KEY = "dealership.token";

// Storage can throw (private mode, blocked site data, quota). A failure
// behaves like an empty store: the user simply signs in again.
export function createTokenStorage(storage: Storage): TokenStorage {
  return {
    get: () => attempt(() => storage.getItem(KEY), null),
    set: (token) => attempt(() => storage.setItem(KEY, token), undefined),
    clear: () => attempt(() => storage.removeItem(KEY), undefined),
  };
}

function attempt<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch {
    return fallback;
  }
}
