export type SessionExpiry = {
  notify(): void;
  subscribe(listener: () => void): () => void;
};

// Bridges the API client's onUnauthorized hook, created outside React,
// to the AuthProvider that owns the session.
export function createSessionExpiry(): SessionExpiry {
  const listeners = new Set<() => void>();
  return {
    notify: () => {
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
