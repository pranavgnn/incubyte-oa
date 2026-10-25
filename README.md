AI Usage

1. Made claude on web generate me a robust CLAUDE.md. https://claude.ai/share/be8e9526-e5af-4376-849b-777031fe3150
2. Scaffolding project using Claude Code CLI. See [PROMPTS.md](./PROMPTS.md)

Noticed that everything commits to main, I'd like to have it work in a branch, submit a pull request (i will manually code review), then on approval, merge. So changed CLAUDE.md

3. Make claude on web generate me a robust DESIGN.md given some reference images from pinterest. https://claude.ai/share/9b0351ce-cd1e-4a79-91ed-ccb088fd1d05

## Design decisions

Places where the implementation is stricter than, or extends, the brief.

- **`GET /api/health` is public.** Deploy checks call it without credentials. It runs `SELECT 1` so a 200 proves the API can reach Postgres, not just that the process is up.
- **`SERVICE_UNAVAILABLE` (503) extends the error code map.** When the database is unreachable, health returns 503 in the standard error shape instead of a generic 500, so "API up, database down" is distinguishable from a crash. The driver's error message is never sent to the client.
- **Password length is capped at 72 UTF-8 bytes, not 72 characters.** bcrypt only uses the first 72 bytes of its input and silently ignores the rest, so a longer password would be accepted but only partly checked at login. Counting bytes means a password of multi-byte characters (e.g. 25 × "€" = 75 bytes) is rejected with 400 instead of being truncated. The minimum stays 8 characters.
- **Login compares a password even when the email is unknown.** An early return for an unknown email would answer in milliseconds while a wrong password takes a full bcrypt comparison, so response time would reveal which emails are registered. The service always calls the hasher, which compares against a fixed cost-12 dummy hash when no user matched and then returns false. Both cases also return the identical 401 `UNAUTHORIZED` "Invalid credentials" body.
- **Login does not apply the register password policy.** The login schema only requires a non-empty password. A password that is too short or over the 72-byte cap is answered with the same 401 "Invalid credentials" as any other wrong password, instead of a 400 that would tell a caller what the policy is.
- **`GET /api/auth/me` extends the brief.** The SPA keeps only the token across page loads, so it needs an endpoint that turns a token back into `{ id, email, role }` to restore the session. It requires a valid bearer token and reads the user from the database rather than echoing the token's claims, so a user deleted after the token was issued gets 401 instead of a ghost session.
- **`requireRole` answers 401, not 403, when there is no identity.** It is meant to run after `authenticate`. If a route were ever wired without `authenticate`, there is no caller to judge, so the route stays closed with 401 `UNAUTHORIZED` instead of passing through or claiming the caller lacks a role. A caller who is authenticated but not an admin gets 403 `FORBIDDEN`.
- **The API is prebundled with esbuild instead of relying on Vercel's zero-config Express build.** Zero-config does not bundle: it compiles each `.ts` file with the repo's TypeScript (7.x here) and renames it to `.js`, but `@dealership/shared` exports its raw `./src/index.ts`, so the deployed function would fail to resolve it at runtime. `scripts/build.ts` bundles `src/vercel.ts` into `dist/index.js` (ESM, Node 22), inlining workspace packages and keeping npm dependencies external for Vercel to install and trace. CI builds and smoke-checks the bundle, so a broken bundle fails the pull request instead of the deploy.
- **The Vercel function uses a small pg pool registered with `attachDatabasePool`.** Each Fluid compute instance keeps its own pool (max 5 clients, 5 s idle timeout) in front of Neon's pooled endpoint. `@vercel/functions` keeps the instance alive just long enough for idle clients to close before it suspends, so Neon's scale-to-zero never finds half-open sockets. This is the same failure class as the idle-client crash already handled in `db/client.ts`. The local server keeps pg's defaults.

## Deploy

The API deploys to Vercel as one Express function from `apps/api` (project Root Directory). `apps/api/vercel.json` sets the Express preset, runs `pnpm build` to produce `dist/index.js`, and pins the function to `sin1` (Singapore), the same AWS region as the Neon database, to keep query latency low. Migrations and the admin seed run from a local machine against Neon's direct (unpooled) connection string: `pnpm --filter api db:migrate` and `pnpm --filter api db:seed`.
