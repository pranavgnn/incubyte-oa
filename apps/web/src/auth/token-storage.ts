export type TokenStorage = {
  get(): string | null;
  set(token: string): void;
  clear(): void;
};

export function createTokenStorage(_storage: Storage): TokenStorage {
  throw new Error("not implemented");
}
