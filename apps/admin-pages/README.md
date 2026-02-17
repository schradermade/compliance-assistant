# Admin Pages Architecture

This app is the Next.js admin dashboard for operational visibility (metrics, ingestion jobs, incidents).

## Directory Layout

- `app/`
  - Next.js App Router entrypoints (`layout.jsx`, `page.jsx`, `globals.css`)
- `components/dashboard/`
  - Reusable presentational UI sections (top bar, KPI grid, cards)
- `lib/dashboard/`
  - Data access, filter normalization, formatting helpers, fallback defaults, and view-model construction

## Design Rules

- Keep `app/page.jsx` orchestration-only.
- Put API calls in `lib/dashboard/api.js`.
- Put computed display logic in `lib/dashboard/view-model.js`.
- Keep components in `components/dashboard/` presentation-focused (no fetch logic).
- Add shared formatting/time helpers under `lib/dashboard/` to avoid duplication.

## Runtime Configuration

- `API_WORKER_URL`
  - Base URL for API Worker endpoints (`/metrics`, `/jobs`, `/incidents`)
  - Default fallback: `http://127.0.0.1:8787`
- `API_AUTH_USER_ID`
- `API_AUTH_USER_EMAIL`
- `API_AUTH_TENANT_ID` (default `tenant_abc`)
- `API_AUTH_ROLES` (default `platform_admin`)
- In non-dev runtime, auth env vars must be set (fetch path fails closed and uses fallback dashboard data).

## Local Development

```bash
pnpm --filter @apps/api-worker dev
API_WORKER_URL=http://127.0.0.1:8787 pnpm run dev:admin
```

## Validation

```bash
pnpm run build:admin
pnpm run preflight
```
