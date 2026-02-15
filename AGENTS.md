# AGENTS.md

## Purpose

This repository is an enterprise client-delivery system. Work must follow governance and architecture standards, not prototype shortcuts.

## Required Standards

1. Schema-first contracts
- Use `zod` schemas in `packages/shared/src/schemas/zod/` as the source of truth.
- Do not create duplicated manual request contract files in `packages/shared/src/schemas/`.
- Derive request types from schemas (`z.infer`).

2. Input validation and error handling
- Treat all external input as untrusted.
- Validate with `safeParse`/`parse` at route boundaries.
- Return standardized validation errors with field-level details for `400` responses.

3. Security and tenancy
- Preserve tenant isolation for all storage and retrieval operations.
- Ensure authorization checks are explicit for protected actions.
- Any security-impacting behavior change must be documented.

4. Observability and auditability
- Include request IDs and structured error context in API responses/logs where applicable.
- Preserve auditability requirements from `docs/architecture.md`.

5. Decision tracking
- Architecture-significant decisions require an ADR update under `docs/adrs/`.

## Workflow Enforcement

Before commit/push, run:
- `pnpm run preflight`

`preflight` must pass before creating a commit intended for merge.

## Reference Docs

- Engineering standards: `docs/engineering-playbook.md`
- PR checklist: `docs/checklists/pr-checklist.md`
- ADRs: `docs/adrs/`
