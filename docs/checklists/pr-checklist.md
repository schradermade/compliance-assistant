# PR Checklist

Complete this checklist before requesting review.

## 1. Contract and Validation

- [ ] New/changed external inputs are defined in `zod` schemas.
- [ ] No duplicated manual request interfaces were introduced.
- [ ] Route handlers validate untrusted input via schema parse/safeParse.
- [ ] Validation failures return standardized `400` field-level errors.

## 2. Security and Authorization

- [ ] Authentication/authorization behavior is explicit for changed routes.
- [ ] Tenant scope is validated for every tenant-scoped action.
- [ ] No secrets/tokens/credentials are committed.
- [ ] Sensitive operations emit audit events.

## 3. Data and Isolation

- [ ] Data paths preserve tenant partitioning (R2, D1, Vectorize, KV).
- [ ] Cross-tenant access scenarios were considered and tested.
- [ ] Any migration/change is idempotent and has rollback notes.

## 4. Observability and Operations

- [ ] Request logs include `requestId`, route, outcome, and latency.
- [ ] Metrics impact is covered (new metric, unchanged metric, or rationale).
- [ ] Error cases are logged with actionable context.

## 5. Testing and Quality Gates

- [ ] `pnpm exec tsc --noEmit` passes.
- [ ] Tests for changed behavior are added/updated.
- [ ] Existing relevant tests pass locally.
- [ ] Edge/error cases are covered.

## 6. Documentation and Decision Tracking

- [ ] README/docs updated for user-visible behavior changes.
- [ ] Architecture docs updated for design-impacting changes.
- [ ] ADR added/updated if this PR makes an architectural decision.

## 7. Release Readiness

- [ ] Staging deploy plan is documented (if applicable).
- [ ] Rollback plan is documented for risky changes.
- [ ] Config and env requirements are documented.
