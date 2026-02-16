# Module 03: API Worker Validation and Routes (Day 3)

## Objective

Own the validation boundary and route handling model.

## Explain From Scratch

Explain:
- difference between raw input (`candidate`) and trusted input (`parsed.data`),
- why `safeParse` + early return improves reliability,
- and why route registration is separate from handler implementation.

## Verify Against Implementation

Review:
- `apps/api-worker/src/index.ts`
- `apps/api-worker/src/routes/query.ts`
- `apps/api-worker/src/routes/ingest.ts`
- `apps/api-worker/src/routes/metrics.ts`
- `apps/api-worker/src/routes/jobs.ts`
- `apps/api-worker/src/routes/incidents.ts`

## Tradeoff Drill

Prompt: "Schema-first validation with Zod vs manual checks"
- include speed, correctness, maintainability, and runtime overhead.

## Pass Criteria

- can explain any route end-to-end in under 2 minutes,
- can justify schema boundary decisions,
- can debug one bad-request example without looking up docs.
