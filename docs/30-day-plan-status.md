# 30-Day Plan Status

Snapshot date: February 17, 2026

## Checked Off

- [x] Day 1: Cloudflare architecture and contracts
  - Evidence: `docs/architecture.md`, `infra/diagrams/cloudflare-system.mmd`, `infra/diagrams/cloudflare-system.svg`
- [x] Day 3: API Worker v1
  - Evidence: `apps/api-worker/src/index.ts`, `apps/api-worker/src/lib/auth.ts`, `apps/api-worker/src/routes/query.ts`, `apps/api-worker/src/routes/ingest.ts`, `apps/api-worker/src/routes/metrics.ts`
- [x] Day 19: Admin dashboard (Next.js on Pages)
  - Evidence: `apps/admin-pages/app/page.jsx`, `apps/admin-pages/lib/dashboard/api.js`, `apps/api-worker/src/routes/metrics.ts`, `apps/api-worker/src/routes/jobs.ts`, `apps/api-worker/src/routes/incidents.ts`

## In Progress

- [ ] Day 2: Monorepo + Wrangler bootstrap
  - Done: scaffolds and env-specific `wrangler.toml` files exist for workers/pages apps, and local verification automation added in `scripts/verify-day2-local-dev.sh` (`pnpm run verify:day2-local-dev`).
  - Remaining: execute local `wrangler dev` verification on a machine with Node.js + pnpm + Wrangler available.
  - Blocker (February 17, 2026): current shell fails `scripts/verify-day2-local-dev.sh` with `Missing required command: node`.
- [ ] Day 9: Metrics and telemetry
  - Done: `GET /metrics` contract and dashboard wiring are live.
  - Remaining: replace static metric payload with measured telemetry and cost accounting.
- [ ] Day 10: Async ingestion with Queues
  - Done: `/ingest` now publishes validated queue messages; `queue-consumer` validates and processes (`parse -> chunk -> embed -> index`) with ack/no-ack semantics; integration tests added for API Worker and queue consumer; staging E2E ingest smoke test added with non-prod safety guardrails.
  - Remaining: add explicit dead-letter strategy and production retry/backoff policy documentation; add persistent downstream completion-state assertions in E2E.
- [ ] Day 18: Identity-aware rate limiting
  - Done: Durable Object class and Worker binding are in place.
  - Remaining: enforce limiter keys by user + tenant + API key and emit block/anomaly events.
- [ ] Day 20: Deployment topology and runbooks
  - Done: deployment/runbook docs started in `docs/runbooks/`.
  - Remaining: execute fresh-environment deploy test directly from docs.

## Not Started (From Plan Sequence)

- [ ] Day 4-8
- [ ] Day 11-17
- [ ] Day 21-30

## Move Forward: Next Execution Queue

1. Day 20 DoD closeout
   - [ ] Run a fresh dev environment deploy strictly from `docs/runbooks/environment-deploy-runbook.md`.
   - [ ] Capture any step drift and patch docs immediately.
2. Day 10 implementation pass
   - [x] Wire `/ingest` to publish queue messages.
   - [x] Implement queue-consumer processing path with tenant-scoped guardrails.
   - [x] Add integration and staging E2E smoke coverage for ingest path.
   - [ ] Add dead-letter handling strategy and retry/backoff controls.
3. Day 2 local runtime verification
   - [ ] Run `pnpm run verify:day2-local-dev`.
   - [ ] Record verification results in this status file.

## Success Metrics

- `Availability`: >= 99% successful responses in 24h staging run
- `Latency`: p50 <= 2.0s, p95 <= 5.0s for standard query profile
- `Groundedness`: >= 80% grounded answers on eval set
- `Retrieval`: Recall@5 >= 0.75, MRR >= 0.60
- `Isolation`: 0 cross-tenant retrieval leaks in integration tests
- `IAM`: OIDC and SAML login pass rate >= 99% in staging tests
- `RBAC`: 100% protected routes enforce role policy
- `Security`: >= 90% known injection/jailbreak tests blocked or defanged
- `Cost visibility`: 100% requests include token + estimated cost metrics

## Validation Load Profile

Use this when reporting outcomes:
- 10 concurrent users for 5 minutes
- Query mix: 70% normal, 20% multi-hop policy, 10% adversarial
- Corpus: >= 200 chunks across >= 3 tenants

## 30-Day Cloudflare-Native Plan

### Week 1: Core Platform on Workers

#### Day 1: Cloudflare Architecture and Contracts
Build:
- system diagram using Workers, R2, Vectorize, D1, KV, Queues
- API contracts for `/query`, `/ingest`, `/metrics`
- tenant and RBAC model

Deliverables:
- `docs/architecture.md`
- `infra/diagrams/cloudflare-system.mmd` (render to `.png` or `.svg` as needed)

DoD:
- final service map locked
- data flow documented end-to-end

Day 1 completion checklist:
- [x] System diagram created using Workers, R2, Vectorize, D1, KV, and Queues
- [x] API contracts defined for `/query`, `/ingest`, and `/metrics`
- [x] Tenant and RBAC model documented
- [x] Deliverable present: `docs/architecture.md`
- [x] Deliverable present: `infra/diagrams/cloudflare-system.mmd`
- [x] Rendered diagram available: `infra/diagrams/cloudflare-system.svg`

#### Day 2: Monorepo + Wrangler Bootstrap
Build:
- app scaffolds for `api-worker`, `ingest-worker`, `queue-consumer`, `admin-pages`
- environment-specific `wrangler.toml` files
- shared schema package

DoD:
- all workers run locally with `wrangler dev`
- deploy stubs available for dev env

#### Day 3: API Worker v1
Build:
- `GET /health`
- `POST /query` with schema validation
- request ID, error middleware, structured logs

DoD:
- invalid requests return structured 400 errors
- logs include tenant + request ID

#### Day 4: Retrieval Data Plane v1
Build:
- R2 upload path and document manifest in D1
- chunk/embed/index pipeline to Vectorize
- retrieval function (top-k with source metadata)

DoD:
- sample docs ingested and searchable
- retrieval returns citations with source IDs

#### Day 5: Orchestration v1
Build:
- query planner
- context assembly from retrieval
- model call wrapper and response normalizer

DoD:
- end-to-end query returns answer + citations

#### Day 6: Eval Harness v1
Build:
- eval dataset and runner
- groundedness and retrieval scoring

DoD:
- eval command outputs score summary and failure cases

#### Day 7: MVP Validation Gate
Build:
- stability fixes
- baseline metrics capture

DoD:
- end-to-end validation works: upload -> query -> grounded answer

### Week 2: Reliability, Observability, and Security Baseline

#### Day 8: Caching
Build:
- KV-backed response cache
- retrieval cache keys by tenant + query hash

DoD:
- measured latency improvement captured in docs

#### Day 9: Metrics and Telemetry
Build:
- latency, token, error-class metrics
- request-level cost estimate
- `/metrics` endpoint

DoD:
- dashboard payload includes per-tenant stats

#### Day 10: Async Ingestion with Queues
Build:
- enqueue ingest tasks
- consumer worker for parse/chunk/embed/index
- retry and dead-letter handling

DoD:
- large ingest no longer blocks API path

#### Day 11: Reliability Controls
Build:
- timeout budget per stage
- retry with backoff
- fallback model strategy

DoD:
- simulated provider failures degrade gracefully

#### Day 12: Guardrails v1
Build:
- prompt injection checks
- unsafe output checks
- policy-aware refusal templates

DoD:
- adversarial test suite passes target threshold

#### Day 13: Security and Audit Baseline
Build:
- audit event schema in D1
- security event logging hooks
- minimal data-retention policy notes

DoD:
- auth and admin actions generate audit records

#### Day 14: Week 2 Readiness Review
Build:
- readiness report with risks and mitigations

Deliverables:
- `docs/production_readiness.md`

DoD:
- unresolved risks explicitly prioritized

### Week 3: Enterprise IAM/SSO and Multi-Tenant Hardening

#### Day 15: Tenant Isolation Hardening
Build:
- tenant-scoped indexing and retrieval keys
- tenant boundary integration tests

DoD:
- zero cross-tenant leakage in test suite

#### Day 16: OIDC SSO via Cloudflare Access
Build:
- Access policy for protected app paths
- OIDC IdP integration
- claim extraction and identity propagation to Workers

DoD:
- OIDC login flow works end-to-end in staging

#### Day 17: SAML SSO + RBAC Mapping
Build:
- SAML IdP integration via Access
- map IdP groups/claims to app roles
- enforce RBAC at route + action level

DoD:
- role mapping integration tests pass for all protected routes

#### Day 18: Identity-Aware Rate Limiting
Build:
- Durable Object limiter keyed by user + tenant + API key
- anomaly indicators and block events

DoD:
- abuse simulation throttles correctly without service failure

#### Day 19: Admin Dashboard (Next.js on Pages)
Build:
- usage, latency, cost, auth-failure, and security-event views
- tenant filter and time-range selector

DoD:
- dashboard reads live metrics from API Worker

#### Day 20: Deployment Topology and Runbooks
Build:
- Cloudflare deployment diagram
- dev/staging/prod runbooks
- rollback and incident playbook

DoD:
- fresh environment can be deployed by documented steps

#### Day 21: IAM/Security Review
Build:
- session/token lifetime policy
- key rotation guidance
- SCIM/JIT provisioning roadmap and gap list

Deliverables:
- `docs/security_review.md`

DoD:
- audit trail includes login, role change, and admin actions

### Week 4: Optimization and Delivery Readiness

#### Day 22: Technical Walkthrough
Build:
- architecture walkthrough video
- explain Cloudflare service tradeoffs and limits

DoD:
- 10-15 minute coherent technical walkthrough recording

#### Day 23: Case Study
Build:
- complete system-design writeup

Deliverables:
- `docs/case_study.md`

DoD:
- includes decisions, alternatives, tradeoffs, and results

#### Day 24: Performance and Cost Optimization
Build:
- optimize prompt/retrieval tokens
- tune cache hit rate
- reduce p95 latency

DoD:
- measurable deltas logged versus baseline

#### Day 25: Multi-Model Routing
Build:
- route simple queries to low-cost model
- escalate hard queries to stronger model

DoD:
- routing decision trace is included in logs

#### Day 26: Guardrails Hardening v2
Build:
- tighten policy filters
- add response compliance checks
- improve refusal/redirect UX

DoD:
- guardrail regression suite passes target threshold

#### Day 27: Stakeholder Handoff Pack
Build:
- concise stakeholder-facing summaries for architecture, IAM, scaling, and failures

Deliverables:
- `docs/stakeholder_handoff.md`

DoD:
- explain each tradeoff in <= 5 minutes

#### Day 28: Repository Packaging
Build:
- final setup docs
- architecture/deployment diagrams
- screenshots and validation evidence links

DoD:
- new user can deploy dev stack from clean clone

#### Day 29: External Review Pass
Build:
- client-readiness self-review
- cleanup of naming, docs, and scripts

DoD:
- no broken links, dead scripts, or unclear setup steps

#### Day 30: Publish
Build:
- final repo release
- client handoff summary page
- release notes with architecture and validation links

DoD:
- all links and validation artifacts are accessible and working

## Weekly Exit Criteria

- End Week 1: working RAG path on Workers with citations
- End Week 2: reliable async ingest + observability + baseline guardrails
- End Week 3: enterprise IAM/SSO + RBAC + tenant hardening complete
- End Week 4: optimized, documented, client-ready system published

## Project Outcome

By Day 30, this repo should deliver a real Cloudflare-native AI platform with enterprise identity controls, operational rigor, and clear engineering tradeoff communication.

## Pause Checkpoint (February 15, 2026)

- Next up: replace `apps/api-worker/src/routes/query.ts` stub answer with real retrieval + model orchestration and grounded citations.
