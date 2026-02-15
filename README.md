# Compliance Assistant (Cloudflare Native)

A 30-day build plan for a fully functioning multi-tenant AI compliance assistant, built on Cloudflare for client delivery.

## Goal

Ship a working system that can:
- ingest compliance documents,
- answer questions with grounded citations,
- isolate tenant data,
- support enterprise IAM/SSO,
- expose reliability/cost/security metrics,
- and run as a Cloudflare-native deployment.

## Cloudflare Service Map

Use these services as the default architecture:
- Compute/API: `Cloudflare Workers`
- Frontend/dashboard: `Cloudflare Pages`
- Document storage: `R2`
- Vector search: `Vectorize`
- Relational metadata: `D1`
- Cache/config/session hints: `KV`
- Queue/async ingestion: `Queues`
- Rate limits/coordination: `Durable Objects`
- Observability: Workers logs + analytics pipeline
- Edge security and identity gate: `Cloudflare Access` (OIDC/SAML IdP)

## Scope

### In scope
- Multi-tenant RAG API on Workers
- Document ingest + chunk + embed + index pipeline
- `/query` answer flow with citations
- Enterprise IAM/SSO (OIDC + SAML) and RBAC mapping
- Usage/cost/latency metrics
- Reliability controls (timeouts/retries/fallback)
- Guardrails and prompt-injection defense
- Admin dashboard on Pages
- Deployment and runbook docs

### Out of scope (30-day limit)
- Multi-region active-active architecture
- SOC2 audit package and formal certification
- Full enterprise SCIM automation beyond a documented implementation path

## Calibrated Success Metrics (Day 30)

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

## Wrangler Project Layout

```txt
apps/
  api-worker/
    src/
      index.ts
      routes/
        health.ts
        query.ts
        ingest.ts
        metrics.ts
      lib/
        auth/
        rbac/
        retrieval/
        orchestration/
        guardrails/
        observability/
        tenants/
        cost/
      bindings.ts
      types.ts
    wrangler.toml

  ingest-worker/
    src/
      index.ts
      processors/
        parse.ts
        chunk.ts
        embed.ts
        index.ts
    wrangler.toml

  queue-consumer/
    src/index.ts
    wrangler.toml

  admin-pages/
    src/
      main.tsx
      pages/
    wrangler.toml

packages/
  shared/
    src/
      schemas/
      prompts/
      eval/

infra/
  wrangler/
    base.toml
    environments/
      dev.toml
      staging.toml
      prod.toml
  diagrams/

docs/
  architecture.md
  cloudflare-deployment.md
  security_review.md
  production_readiness.md
  case_study.md

evals/
  dataset.jsonl
  runner.ts
  scoring.ts

tests/
  unit/
  integration/
  e2e/
```

## Environment and Bindings Standard

Each Worker uses explicit bindings in `wrangler.toml`:
- `R2_BUCKET` for source docs and ingest artifacts
- `VECTORIZE_INDEX` for embeddings
- `DB` (`D1`) for tenant, user, request, and audit metadata
- `CACHE_KV` (`KV`) for fast cache keys and feature flags
- `INGEST_QUEUE` for async ingestion jobs
- `RATE_LIMITER_DO` durable object namespace
- Secrets for model provider and signing keys

Use three environments:
- `dev`
- `staging`
- `prod`

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

#### Day 19: Admin Dashboard on Pages
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

## Initial Commands

```bash
pnpm install
pnpm dlx wrangler whoami
pnpm --filter @apps/api-worker dev
pnpm --filter @apps/admin-pages dev
```

## Project Outcome

By Day 30, this repo should prove you can ship a real Cloudflare-native AI platform with enterprise identity controls, operational rigor, and clear engineering tradeoff communication.
