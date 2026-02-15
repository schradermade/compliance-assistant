# ADR-0001: Schema-First Validation and Contract Definition

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Engineering

## Context

Initial implementation used manually defined TypeScript interfaces plus separate validator logic.
This created two contract sources:
1. interface/type definitions,
2. runtime validation checks.

Risk:
- contract drift over time,
- inconsistent error behavior across routes,
- duplicated maintenance cost.

## Decision

Adopt `zod` schemas as the single source of truth for input contracts.

Rules:
1. All external input is parsed with `schema.safeParse(...)` or `schema.parse(...)`.
2. TypeScript types for request payloads are derived from schemas (`z.infer`).
3. Hand-written duplicate request interfaces are not allowed.
4. Validation errors are returned in a standardized `400` response format with field-level issues.

## Alternatives Considered

1. Keep manual interfaces + custom validators
  - Rejected due to drift risk and duplicated effort.
2. Use boolean type guards only
  - Rejected due to weak error diagnostics and inconsistent behavior.
3. Use another validation library (e.g., valibot)
  - Deferred; may revisit for performance/bundle tradeoffs after baseline delivery.

## Consequences

Positive:
- compile-time and runtime contracts stay aligned,
- clearer API error responses,
- easier onboarding and review.

Tradeoffs:
- small runtime overhead from schema parsing,
- dependency on `zod`,
- migration overhead for legacy contract code.

## Implementation Notes

- Schema modules live under `packages/shared/src/schemas/zod/`.
- Validators may wrap schemas for convenience, but schema remains authoritative.
- PRs introducing new endpoints must include corresponding zod schema updates.
