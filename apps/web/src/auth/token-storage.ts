export type TokenStorage = {
  get(): string | null;
  set(token: string): void;
  clear(): void;
};

const KEY = "dealership.token";

export function createTokenStorage(storage: Storage): TokenStorage {
  return {
    get: () => storage.getItem(KEY),
    set: (token) => storage.setItem(KEY, token),
    clear: () => storage.removeItem(KEY),
  };
}
