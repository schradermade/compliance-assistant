# Environment Deploy Runbook

Last updated: February 17, 2026

## Purpose

Deploy `api-worker`, `ingest-worker`, `queue-consumer`, `admin-pages`, and `user-portal` to `dev`, `staging`, or `prod`.

## Prerequisites

- Wrangler authenticated to the target Cloudflare account.
- Runtime resource IDs in `docs/cloudflare-resources.md` match the target environment.
- Required secrets added from `docs/cloudflare-secrets.md`.
- Branch contains the intended release commit.

## Deploy Order

1. Validate local state and governance checks.
2. Deploy Worker services.
3. Deploy Pages applications.
4. Smoke test endpoints and UI connectivity.

## Step-by-Step

1. Preflight:
   - `pnpm run preflight`
2. API Worker:
   - `pnpm dlx wrangler deploy --config apps/api-worker/wrangler.toml --env <env>`
3. Ingest Worker:
   - `pnpm dlx wrangler deploy --config apps/ingest-worker/wrangler.toml --env <env>`
4. Queue Consumer:
   - `pnpm dlx wrangler deploy --config apps/queue-consumer/wrangler.toml --env <env>`
5. Admin Pages:
   - `pnpm dlx wrangler pages deploy apps/admin-pages --project-name compliance-admin-pages-<env>`
6. User Portal:
   - `pnpm dlx wrangler pages deploy apps/user-portal --project-name compliance-user-portal-<env>`

## Smoke Tests

1. API health:
   - `curl -sS <api-base-url>/health`
2. Metrics contract:
   - `curl -sS \"<api-base-url>/metrics?tenantId=tenant_abc\"`
3. Query validation path:
   - send malformed payload and confirm standardized `400` with field-level detail.
4. Dashboard integration:
   - open admin pages and confirm metrics/jobs/incidents cards load.

## Tenant and Security Checks

- Validate tenant-scoped reads by querying with two different `tenantId` values.
- Validate protected action denial path for non-admin ingestion attempt.
- Confirm request IDs are present in API responses for traceability.

## Rollback Trigger Conditions

- Sustained `5xx` increase after deploy.
- Cross-tenant data exposure signal.
- Broken authz behavior on protected endpoints.

When triggered, follow `docs/runbooks/incident-and-rollback-playbook.md`.
