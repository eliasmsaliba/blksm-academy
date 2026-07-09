# BLKSM Academy — Learning Management System

Part of the **BLKSM OS** ecosystem. A proprietary, enterprise-grade LMS platform for BLKSM Events:
unlimited academies/courses/modules/lessons, DB-configurable RBAC, certification tracking, SOP
library, knowledge base, assessments, and more.

**This is Phase 1 — the platform, not the content.** The Academy team populates real courses/SOPs/
assessments later. This build establishes the full data model and a working core so nothing here
requires a breaking migration when that content lands.

## Architecture

- **`apps/api`** — NestJS REST API (`/api/*`), Prisma ORM, Postgres.
- **`apps/web`** — Next.js 16 (App Router) frontend, calls the API directly from the browser.
- **`packages/shared`** — shared TypeScript enums, permission constants, and cross-cutting types.

The frontend and backend are **separate services on separate origins** by design, so a future
mobile app or integration can talk to the same API. Auth is cookie-based (httpOnly access + refresh
tokens issued by the API); the web app is a client-rendered console that calls the API with
`credentials: 'include'`. See `apps/web/src/lib/auth-context.tsx` and `apps/api/src/modules/auth`.

## Running it

### Option A — Docker Compose (matches production)

```bash
cp .env.example .env   # edit secrets/passwords for anything beyond local dev
docker compose up -d
docker compose exec api npm run db:migrate:deploy --workspace=apps/api
docker compose exec api npm run db:seed --workspace=apps/api
```

Web: http://localhost:3000 · API: http://localhost:4000/api

### Option B — Run natively (faster iteration, no Docker required)

Useful if Docker isn't installed. Postgres runs via the `embedded-postgres` dev dependency (a real
Postgres binary, no Docker) — this is a **local dev convenience only**; Docker Compose remains the
source of truth for how Postgres runs in staging/production.

```bash
npm install
cp .env.example .env
npm run dev:postgres          # starts a local Postgres on :5432, leave running
npm run db:migrate             # apply the Prisma schema
npm run db:seed                # roles, permissions, super admin, DEMO content
npm run dev:api                # http://localhost:4000/api
npm run dev:web                # http://localhost:3000
```

Log in with `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` from `.env` (defaults:
`superadmin@blksmevents.com` / `ChangeMe123!`).

### Wiping demo data

Everything seeded for verification (one department, one academy → course → module → 2 lessons) is
flagged `isDemoData: true`. Remove it any time with:

```bash
npm run db:wipe-demo
```

## What's fully working (Phase 1)

- **Auth**: email/password login, argon2id hashing, JWT access token (15 min) + rotating opaque
  refresh token (30 days, reuse detection revokes the session family), httpOnly cookies.
  Designed so SSO (Google/Microsoft/SAML) is additive later — see `AuthIdentity` in the schema.
- **RBAC**: permissions are database rows (`resource.action`), grouped into roles via
  `RolePermission`. Nothing is hardcoded — Super Administrator is just the role with every
  permission. Admin console includes a full role/permission editor. 10 default roles seeded per
  the product brief.
- **Org structure**: departments (nested), positions, employee profiles.
- **Academy hierarchy**: Academy → Course → CourseModule → Lesson, full CRUD via the admin console,
  ordering, arbitrary nesting depth, no hardcoded limits anywhere.
- **Attachments**: file upload on lessons via a swappable storage driver interface (local disk in
  dev; swap the driver for S3/Azure Blob in production without touching calling code).
- **Enrollment & progress**: self-enrollment from the catalogue, lesson completion, auto-recomputed
  course-level progress percentage.
- **Frontend**: login, role-aware dashboard, admin console (users, roles & permissions, departments,
  academy/course/module/lesson management), learner-facing catalogue → course → lesson viewer
  (renders rich text/video/audio/image/PDF/embed/link content types).

## What's schema-only / stubbed (Phase 2+)

The Prisma schema already models every domain in the product brief so **no future migration should
break existing data** — but the API/UI for these is not built yet:

- Question bank, assessment/exam taking + grading, timed/randomized exams, attempt limits.
- Assignment submission + rubric grading UI.
- Competency framework UI (schema supports course- or assessment-sourced competencies).
- Certificate generation (PDF rendering, QR verification, numbering, versioning).
- Learning path prerequisite/auto-unlock engine (CRUD stub only for defining paths).
- SOP Library and Knowledge Base (basic CRUD stub only, no revision-history UI, no tagging UI).
- Notification delivery (in-app bell, email) — schema exists, nothing sends yet.
- Reporting (completion rates, cert expiry, competency gaps) and Excel/PDF export.
- Global search across courses/lessons/SOPs/KB.

`apps/api/src/modules/{questions,assessments,assignments,competencies,certifications,learning-paths,notifications}`
contain module skeletons only, ready to be filled in.

## Key files

- `apps/api/prisma/schema.prisma` — the complete data model.
- `apps/api/prisma/seed.ts` / `wipe-demo.ts` — seeding and demo-data cleanup.
- `apps/api/src/common/guards/permissions.guard.ts` — RBAC enforcement.
- `apps/api/src/modules/auth/auth.service.ts` — login/refresh/logout, token issuance.
- `apps/web/src/lib/api-client.ts` — typed fetch wrapper for every API module.
- `apps/web/src/lib/auth-context.tsx` — client-side session/permission state.
- `packages/shared/src/permissions/index.ts` — the single source of truth for permission keys and
  default role bundles (consumed by both the API seed and the frontend).
- `docker-compose.yml` — Postgres + API + web. Redis is commented out; uncomment when Phase 2 wires
  up BullMQ-backed notification delivery.

## Deploying (Netlify + Railway + GitHub)

Netlify hosts the Next.js frontend only. The API + Postgres run on Railway (persistent server,
persistent disk for uploads — Netlify's serverless functions can't do either). See `railway.json`
(points at `apps/api/Dockerfile.production`, a compiled/production build distinct from the
dev-oriented `Dockerfile` used by `docker-compose.yml`) and `netlify.toml`.

1. Push this repo to GitHub.
2. **Railway**: new project → Add a Postgres database → Add a service from this GitHub repo (it
   picks up `railway.json` automatically). Set env vars: `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_TTL`,
   `REFRESH_TOKEN_TTL_DAYS`, `CORS_ORIGIN` (your Netlify URL, added after step 3), `STORAGE_DRIVER=local`,
   `STORAGE_LOCAL_PATH=/data/uploads`, `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_PASSWORD`.
   `DATABASE_URL` is auto-injected by the Postgres plugin. Attach a Volume mounted at `/data` so
   uploaded files survive redeploys. Run `npm run db:seed --workspace=apps/api` once via Railway's
   shell/one-off command.
3. **Netlify**: import the same repo. `netlify.toml` includes a redirect that proxies `/api/*`
   through to Railway (edit the `to =` URL in `netlify.toml` to match your actual Railway domain).
   Set `NEXT_PUBLIC_API_URL=/api` (a relative path, **not** the Railway URL — see below for why).
4. Go back to Railway and set `CORS_ORIGIN` to your Netlify URL, redeploy.

**Why the frontend calls `/api` through a Netlify proxy instead of Railway directly:** Netlify and
Railway are different domains, and modern browsers increasingly block third-party cookies outright
— no CORS/SameSite configuration fixes that, login just silently fails to persist a session. Routing
`/api/*` through Netlify's own domain (via the `[[redirects]]` rule in `netlify.toml`) makes the
request same-origin from the browser's point of view, so the auth cookie is set as first-party for
the Netlify domain instead. `apps/api/src/modules/auth/auth.controller.ts` still sets
`SameSite=None; Secure` in production as a fallback/defense-in-depth, but the proxy is what actually
makes cross-domain auth reliable.

## Notes for whoever picks this up next

- Cross-origin cookies: the API sets cookies host-scoped to `localhost` (no explicit `Domain`), which
  works across ports in dev because cookie scoping ignores port per RFC 6265. In production across
  real subdomains (e.g. `app.blksmacademy.com` / `api.blksmacademy.com`), set `COOKIE_DOMAIN` to the
  shared parent domain and `CORS_ORIGIN` to the real frontend origin(s).
- The frontend is deliberately client-rendered for data (no server-side data fetching) since the API
  lives on a separate origin — see the architecture note above before adding Server Component data
  fetching, which would need to manually forward cookies via `next/headers`.
- Route protection: `apps/web/src/proxy.ts` does an *optimistic* cookie-presence redirect only; real
  authorization is always enforced by the API's 401/403 responses, and each protected route group
  (`(app)/layout.tsx`, `(app)/admin/layout.tsx`) also gates client-side on load.
