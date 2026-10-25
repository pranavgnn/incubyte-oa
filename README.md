AI Usage

1. Made claude on web generate me a robust CLAUDE.md. https://claude.ai/share/be8e9526-e5af-4376-849b-777031fe3150
2. Scaffolding project using Claude Code CLI. See [PROMPTS.md](./PROMPTS.md)

Noticed that everything commits to main, I'd like to have it work in a branch, submit a pull request (i will manually code review), then on approval, merge. So changed CLAUDE.md


## Design decisions

Places where the implementation is stricter than, or extends, the brief.

- **`GET /api/health` is public.** Deploy checks call it without credentials. It runs `SELECT 1` so a 200 proves the API can reach Postgres, not just that the process is up.
- **`SERVICE_UNAVAILABLE` (503) extends the error code map.** When the database is unreachable, health returns 503 in the standard error shape instead of a generic 500, so "API up, database down" is distinguishable from a crash. The driver's error message is never sent to the client.
