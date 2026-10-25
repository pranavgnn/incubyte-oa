// `next` comes from the query string, so it is attacker-controlled. Only a
// single-slash, same-origin path is followed; "//host" and "/\host" are
// treated by browsers as other origins.
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}
