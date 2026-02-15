# Engineering Playbook

This document defines the non-negotiable development standards for the Compliance Assistant platform.

## 1. Scope and Intent

This is a client-delivery enterprise system, not a prototype. Every change must preserve:
- tenant isolation,
- security controls,
- operational observability,
- maintainable architecture.

## 2. Core Principles

1. Schema-first contracts: runtime schemas are the source of truth.
2. Security by default: no endpoint ships without authz and audit consideration.
3. Tenant safety first: no feature may weaken tenant boundaries.
4. Operability required: structured logs and metrics are part of done.
5. Incremental rigor: small changes, tested, documented, reversible.

## 3. Architecture Guardrails

- Cloudflare-native platform: Workers, Pages, R2, D1, Vectorize, KV, Queues, Durable Objects, Access.
- Environment separation is mandatory: `dev`, `staging`, `prod`.
- Secrets are never committed. Use Wrangler secrets and environment-specific config.
- Async workloads must not block synchronous API paths.

## 4. Contract and Validation Policy

- `zod` schemas define request contracts and runtime validation.
- TypeScript request/response types are derived from schemas (`z.infer`), not duplicated manually.
- All external input (`request.json`, query params, headers, queue messages) is treated as untrusted until parsed.
- Validation failures return standardized `400` responses with field-level details.

## 5. Authorization and Tenant Isolation Policy

- All protected routes require explicit role checks.
- Tenant scope must be validated on every request.
- All data stores must enforce tenant partitioning:
  - R2 path prefix by tenant,
  - Vectorize metadata tenant filter,
  - D1 tenant foreign keys,
  - KV tenant-prefixed keys.
- Authorization decisions are auditable events.

## 6. Logging, Metrics, and Audit Requirements

- Every API request emits a `requestId`.
- Structured logs include: `requestId`, `tenantId`, route, outcome, latency.
- Metrics include at minimum: request volume, success rate, p50/p95 latency, token usage, estimated cost.
- Security-sensitive operations emit audit records (login, role changes, admin operations, ingestion actions).

## 7. Testing Strategy

- Unit tests for core library logic and parsers.
- Integration tests for endpoint contracts, tenant scope, RBAC, and error shapes.
- E2E tests for critical paths (`/query`, `/ingest`, `/metrics`, auth flow).
- Regression tests for known incidents and security edge cases.

Required local quality bar before merge:
1. `pnpm exec tsc --noEmit`
2. lint passes (when lint is introduced)
3. test suite for changed area passes

## 8. Documentation and ADR Policy

- Any architecture-significant decision requires an ADR in `docs/adrs/`.
- ADRs must capture:
  - context/problem,
  - decision,
  - alternatives considered,
  - consequences/tradeoffs.
- API contract changes must update architecture docs and examples.

## 9. Definition of Done (Engineering)

A change is done only when all are true:
1. Functional behavior implemented.
2. Validation and error handling are complete.
3. Security/tenant implications are addressed.
4. Logs/metrics/audit hooks are included where applicable.
5. Tests are added/updated.
6. Documentation/ADR updates are included if needed.

## 10. Release and Change Management

- Deploy to staging before production.
- High-risk changes require explicit rollback notes in PR description.
- Data migrations require idempotent scripts and rollback strategy.
- Incident postmortems create follow-up tasks and, when architectural, new ADRs.
