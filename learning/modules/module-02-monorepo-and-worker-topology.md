# Module 02: Monorepo and Worker Topology (Day 2)

## Objective

Understand why the repo is split by workload (api-worker, ingest-worker, queue-consumer, admin-pages, user-portal).

## Explain From Scratch

Explain:
- why ingest should not run on the request path,
- what breaks if admin and user UI share one app surface,
- and how environment-specific config is handled.

## Verify Against Implementation

Review:
- `README.md` project layout sections
- `apps/api-worker/wrangler.toml`
- `apps/ingest-worker/wrangler.toml`
- `apps/admin-pages/wrangler.toml`
- `apps/user-portal/wrangler.toml`

## Debug Drill

Scenario: dashboard works locally but cannot reach API in staging.
- List top 5 checks in order.
- Include one DNS/config check and one auth/policy check.

## Pass Criteria

- can justify split responsibilities by failure mode,
- can explain dev/staging/prod config flow,
- can produce a 5-step triage checklist from memory.
