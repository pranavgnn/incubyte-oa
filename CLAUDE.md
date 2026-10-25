# CLAUDE.md

Car Dealership Inventory System: a TDD kata. Full-stack TypeScript pnpm monorepo. The commit history is graded as heavily as the code.

## Session start

1. Invoke the `caveman` skill. Caveman applies **only to chat replies to me**. Code, comments, commit messages, README, docs, test names, error messages, and UI copy are always written in normal, clear English.
2. **context7 first.** Before writing or changing code that touches any library (Express 5, Drizzle, Zod, Vitest, Supertest, React Router, Tailwind v4, shadcn/ui, MSW, RTL, Biome, oxlint, the JWT lib, the Vercel runtime, the Neon driver), use the context7 MCP to pull current docs. Do not rely on memory. APIs in this stack changed recently (Express 5 async errors, Tailwind v4 CSS-first config, React Router data APIs). If context7 has nothing, say so before guessing.

## Stack

- `apps/api`: Express 5, Drizzle ORM, Postgres (Docker locally, Neon in prod), Vitest + Supertest
- `apps/web`: React SPA, React Router, Tailwind v4, shadcn/ui, Vitest + React Testing Library + MSW
- `packages/shared`: Zod schemas and inferred types. This is the single source of truth for request and response contracts on both sides.
- Tooling: Biome for lint and format repo-wide. oxlint runs **only in `apps/web`**, and only to run the `@shadcn/lint` design-system rules. GitHub Actions for CI. Vercel hosts two projects: the API as a function and the SPA as a static site.

## Commands

Keep these scripts working. Add them during setup if they are missing.

```
pnpm install
docker compose up -d                        # postgres: dev db + test db
pnpm --filter api db:generate | db:migrate   # drizzle-kit
pnpm --filter api db:seed                   # creates/resets the admin user
pnpm dev                                    # api + web
pnpm test                                   # all tests
pnpm test:coverage                          # enforces thresholds
pnpm --filter api test:report               # writes the test report used in the README
pnpm lint                                   # biome check (+ oxlint in web)
pnpm typecheck
```

## Build order

0. **Setup.** This covers the monorepo, tooling, docker compose, env schemas, CI, and a public `GET /api/health` endpoint used to verify deploys. Health needs no auth and returns 200 `{ "status": "ok" }` after a trivial DB query (`SELECT 1`), or 503 in the standard error shape if the DB is unreachable. It is test-driven like everything else.
1. **Backend first, completely.** That means every endpoint in the brief, tests green, and coverage thresholds met. Do not create UI code before this is done.
2. **Frontend second.** Read `DESIGN.md` before any UI work, every session. If it is missing, stop and ask.

## Strict TDD: one cycle per behaviour

A behaviour is one observable rule, for example "purchase returns 409 when stock is 0". It is never a whole endpoint.

1. **Red.** Write one failing test for the behaviour. Run it and confirm it fails *for the expected reason*. Commit: `test(scope): <behaviour>`.
   - Red commits must still typecheck. If needed, add the minimal stub (signature only, throws `new Error("not implemented")`) so the failure happens at runtime, not at compile time.
2. **Green.** Write the minimum code to pass. Run the full relevant suite. Commit: `feat(scope): <behaviour>` (or `fix`).
3. **Refactor.** Clean up with all tests green. Commit: `refactor(scope): <what>`. Do this whenever there is something real to improve. **Never make empty or fake refactor commits.**

Other rules:
- No production code without a failing test that demanded it.
- Setup and config commits (`chore`, `build`, `ci`, `docs`) sit outside the cycle. Keep them separate and small.
- Pre-commit hooks run lint, format, and typecheck only, **not tests**, so red commits stay possible.

## Commits

Conventional Commits, small and frequent, and each message must explain *why*. Every commit where you helped (which is every commit you make) ends with a body, **two empty lines**, then exactly one trailer:

```bash
git commit -F - <<'EOF'
feat(api): reject purchase when stock is zero

Conditional UPDATE returns no row when quantity < requested; service
maps that to OutOfStockError (409). Claude Code wrote the implementation
against my failing test.


Co-authored-by: Claude <noreply@anthropic.com>
EOF
```

Use only that trailer. Do not add the default "Generated with Claude Code" line or a second co-author line.

## Backend architecture (`apps/api`)

Layered and SOLID. Dependencies point inward only.

```
routes/        path + middleware wiring (auth, role, validate) → controller method
controllers/   HTTP only: read validated input, call service, shape response. No logic.
services/      business rules. No req/res, no Drizzle, no SQL.
repositories/  Drizzle queries only. Implement interfaces declared next to the services.
db/            drizzle schema, migrations, client, seed
middleware/    authenticate, requireRole, validate(zodSchema), errorHandler
errors/        AppError hierarchy
config/env.ts  zod env schema → typed `env`; only place reading process.env
app.ts         createApp(deps): builds the Express app; no listen()
container.ts   composition root: wires real repos → services → controllers
server.ts      local entry: builds the real container, calls createApp(deps), listen()
api/index.ts   Vercel entry: builds the real container, exports createApp(deps); no listen()
```

- **Dependency injection:** use manual constructor injection, no DI framework. Services depend on repository *interfaces*. `container.ts` is the only place that instantiates concrete classes. Tests pass fakes or test-DB repos into `createApp(deps)`.
- Express 5 forwards async errors. Do not wrap handlers in try/catch and do not add async-handler libraries.

## Validation & env (Zod everywhere)

- **All validation uses Zod. No other validation library, and no hand-rolled `if` checks on input.**
- Request schemas (body, query, params) and response schemas live in `packages/shared`. Use strict objects so unknown keys are rejected. Derive types with `z.infer`; never duplicate them by hand. The `validate(schema)` middleware parses the input and replaces `req.body`/`req.query`/`req.params` with the parsed output. A Zod failure becomes `VALIDATION_ERROR` 400 with the issues in `details`.
- **`apps/api/src/config/env.ts`** defines a Zod schema for every variable (`DATABASE_URL`, `JWT_SECRET` min 32, `JWT_EXPIRES_IN`, `WEB_ORIGIN`, `PORT`, `NODE_ENV`, …). Use coercion and defaults where sensible. It parses `process.env` once at startup, fails fast with a readable message listing the bad keys, and exports a frozen, typed `env`.
- **`apps/web/src/env.ts`** does the same for `import.meta.env` (e.g. `VITE_API_URL`).
- **Nothing outside the two `env.ts` files reads `process.env` or `import.meta.env` directly.** Inject config into services via the container instead of importing `env` deep in the code. Tests build their own config object.
- Keep `.env.example` in sync with the env schema. Every key in the schema appears in the example.

## Error response shape

Every non-2xx response uses exactly this shape. It is produced only by `errorHandler`:

```json
{ "error": { "code": "OUT_OF_STOCK", "message": "Human readable", "details": [] } }
```

Map errors to statuses as follows: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` / `OUT_OF_STOCK` 409, `INTERNAL_ERROR` 500. Throw typed `AppError` subclasses. Unknown errors become a 500 with a generic message; stack traces and DB errors never leak. Unknown routes return 404 in the same shape.

## Inventory concurrency

- The DB enforces `CHECK (quantity >= 0)` on vehicles. This is the last line of defence.
- **Purchase is one atomic conditional update**, never read-then-write:
  `UPDATE vehicles SET quantity = quantity - $n WHERE id = $id AND quantity >= $n RETURNING *`
  If no row is returned, check existence to decide between 404 and 409 `OUT_OF_STOCK`.
- Restock follows the same pattern: `quantity = quantity + $n`, admin only, `n` must be a positive int.
- Keep these as single statements so they behave the same on local Postgres and on Neon, whatever driver is used.
- **Required test:** seed stock `k`, fire `N > k` purchases in parallel against the real test DB, then assert exactly `k` responses of 200, `N - k` responses of 409, and final quantity 0.

## Security

- Hash passwords with bcrypt (`bcryptjs`, cost ≥ 12; pure JS so it is safe on Vercel). Never return the hash or password in any response or log.
- JWT signed with `JWT_SECRET` from env (zod-enforced, ≥ 32 chars), with short expiry. The `authenticate` middleware verifies the token. `requireRole("admin")` guards create, update, delete and restock. All vehicle and inventory routes require auth.
- `register` always creates role `user`. A client-supplied `role` is rejected by the strict schema.
- **Admins are created only by `db:seed`.** It generates a fresh password with `crypto.randomBytes` on every run, upserts the admin, and prints the credentials once to stdout. Never hardcode the password, never write it to a file, never commit it.
- Login failures return a generic "Invalid credentials" message for both unknown email and wrong password.
- Use `helmet`, CORS restricted to `WEB_ORIGIN`, a JSON body size limit, and ensure no secrets in the repo. Keep `.env.example` current.

## Testing

- **Integration tests run against a real Postgres test DB**, a separate database in docker compose. Never use an in-memory DB or mock Drizzle. Vitest `globalSetup` runs migrations. Truncate tables between tests. API test files run serially (or one DB per worker) so they do not race.
- Service unit tests may use hand-written fake repositories that implement the interface. Every route still needs Supertest coverage of its happy path, auth (401), role (403), validation (400), and not-found (404) cases.
- Web tests use RTL with `user-event` and query by role or label, never by test IDs unless unavoidable. Use MSW for every network call; never stub `fetch` directly. Cover forms, the search/filter flow, purchase disabled at 0, and admin-only UI.
- **Coverage thresholds, enforced in Vitest config and CI:** api 90% lines/functions/statements and 85% branches; web 80% across the board.
- CI (GitHub Actions) runs install, lint, typecheck, and tests with coverage against a Postgres service container. CI must stay green on `main`.

## Frontend (`apps/web`)

- Read `DESIGN.md` first. Its tokens and rules override defaults.
- Add shadcn components via its CLI. Do not hand-copy them. Configure Tailwind v4 CSS-first (no `tailwind.config.js` unless context7 says it is needed).
- A typed API client parses responses with the shared Zod schemas and surfaces the `error.code` and `error.message` shape.
- The Purchase button is disabled when `quantity === 0`. Admin controls are hidden for non-admins, but the server remains the authority.
- The UI must be responsive and accessible (labels, focus states, keyboard navigation).

## Hard rules

- **Never** skip, delete, `.skip`/`.only`, or weaken a test or assertion to make something pass. Never lower coverage thresholds. If a test is wrong, explain why and ask first.
- **Never** use `--no-verify`, never force-push, and never rewrite pushed history.
- **Never** read, create, edit, or delete `PROMPTS.md`. I maintain it by hand.
- **Never** copy code from other repositories, gists, or tutorials. Write original code. Library docs from context7 are for API usage, not for pasting projects.
- **Never** write the "My AI Usage" reflection in the README on my behalf. Leave headed placeholders for me.
- **Ask, don't assume.** If a feature prompt from me leaves a detail open (a status code, a validation rule, who may call an endpoint, a default value, an edge case), ask before writing the test. The test encodes the decision, so a guess becomes a spec.
- The README has a "Design decisions" section. It must document every place where the implementation is stricter than, or extends, the brief, and why. Examples: create and update vehicles being admin-only, and `/api/health` being public. Add an entry in the same commit that introduces the decision.
- Never commit `.env`, secrets, or seed passwords.
- Do not add dependencies without saying why; check context7 for the current API first.
- If the brief, this file, or `DESIGN.md` conflict or are unclear, stop and ask instead of guessing.