# First-Principles Map

Use this as the base mental model.

## Constraints -> Design

- Need low-latency API at edge -> Cloudflare Workers for request handling.
- Need tenant isolation -> tenant-scoped keys/filters in every storage and route.
- Need async ingest -> Queue + consumer worker path.
- Need enterprise auth -> Cloudflare Access (OIDC/SAML) + app-level RBAC checks.
- Need auditability -> structured request IDs and authz decision traces.

## Request Paths

- Sync query path: user -> worker `/query` -> retrieval + model -> response with citations.
- Async ingest path: admin -> worker `/ingest` -> queue -> ingest worker -> index/storage updates.
- Ops path: admin dashboard -> worker metrics/jobs/incidents endpoints.

## Core Boundaries

- Untrusted input boundary: request parsing and validation (`safeParse`).
- Authorization boundary: role + tenant scope enforcement before action.
- Reliability boundary: timeout/retry/fallback around external model calls.
- Observability boundary: request ID, structured logs, and metrics on every request.
