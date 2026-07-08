See the [root README](../../README.md) for how to run the full stack (API + web + Postgres).

This app is the Next.js frontend for BLKSM Academy. It calls the API at `apps/api` directly from
the browser (see `src/lib/api-client.ts`) — it does not fetch data server-side.
