# Module 01: Architecture and Contracts (Day 1)

## Objective

Be able to explain why each Cloudflare service exists and how `/query`, `/ingest`, and `/metrics` contracts support the system.

## Explain From Scratch

Without opening files, explain:
- why this system is not a single service,
- how sync query differs from async ingest,
- and where tenant isolation can fail.

## Verify Against Implementation

Review:
- `docs/architecture.md`
- `infra/diagrams/cloudflare-system.mmd`

## Tradeoff Drill

Prompt: "Why Workers + Queues + D1/KV/Vectorize instead of one monolith DB + API server?"

Answer structure:
1. constraint
2. chosen design
3. downside
4. mitigation

## Pass Criteria

- can draw the system from memory,
- can justify at least 3 major tradeoffs,
- can identify 2 likely isolation failure points.
