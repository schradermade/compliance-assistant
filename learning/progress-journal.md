# Learning Progress Journal

## Session Template

- Date: 2/15/26
- Module: 01
- Time spent:

### Blank-Slate Explanation (3-5 min)

### Where I got stuck

### What I misunderstood

Next API proxy route

### Fix I can now explain clearly

### Confidence (1-5)

---

## Session Log

- (add entries)

## Questions

Question 1 (90 seconds):
Walk me through the full system architecture for a user query, end to end, and name each major Cloudflare service involved and why it exists.

Nathan's Answer:
A user query starts in a user-portal app that is built with Next.js. The user composes a request with tenant_id, topK, question. A query is made to the api-worker, which directs the endpoint call to the appropraite route handler for handling queries. This handler retrieves data from D1, KV, R2, and sends this data long with the original query to the Model. the model returns a response, whcih is forwarded back to the user.

Score:
Clarity: 4/5
Correctness: 2.5/5
Tradeoffs: 1/5
Debugging readiness: 1/5
Ownership signal: 2.5/5

Key corrections:

- Current implementation does not yet do real retrieval/model orchestration in POST /query; it returns a stub response.
- Query path should emphasize Vectorize for retrieval; D1/KV/R2 are supporting stores, not all always in-path per query.
- Missing Cloudflare Access/identity boundary (important for enterprise narrative).
- No mention of validation boundary (safeParse) and tenant-scope enforcement.

Interview-ready version (tight):
“A user submits tenantId, question, and optional topK from the Next.js user portal. The portal calls a Next API proxy route, which forwards to the Cloudflare API Worker /query. At the Worker boundary, request schema validation runs first, then tenant/role scope checks. In the target architecture, retrieval is tenant-filtered from Vectorize, with metadata from D1 and optional cache lookups in KV; R2 is primarily document/object storage for ingestion assets. The Worker then calls the model provider with grounded context and returns answer + citations + usage metadata. Today, the /query route is still stubbed, but the endpoint contract and UI-to-endpoint path are live.”

---

Question 2 (90 seconds):
What is the difference between sync query path and async ingest path, and why is ingest async in this architecture?

Nathan's answer:
The sync query path is for the end user, where the async ingest path is for the admin user. In the case of the end user, the process must finish right away for best UX, and we assume the user is actively waiting for the response to return. Where the ingest async path deviates is by implementing a Cloudflare Queue which allows the jobs to enqueue if necessary.

Score:
Clarity: 4/5
Correctness: 3.5/5
Tradeoffs: 2/5
Debugging readiness: 1/5
Ownership signal: 3/5
Strong points:

Correct distinction: user-facing query is sync; ingest uses Queue async.
Correct UX motivation for sync query latency.
What to strengthen:

Async ingest is not only “if necessary”; it is the default to protect API latency and reliability.
Mention concrete async benefits: durability, retries/backoff, idempotency, dead-letter handling.
Mention ingest stages: parse/chunk/embed/index, which are variable/long-running and unsuitable for request path.

Interview-ready version:
“Sync query is optimized for interactive latency: user request enters API Worker and returns immediately with a bounded response budget. Async ingest is intentionally offloaded to Cloudflare Queues because document processing is multi-stage and long-running (parse, chunk, embed, index). Queue decoupling protects query SLOs, enables retries/backoff, supports idempotency, and avoids tying user response time to ingest workload spikes.”

---

Question 3 (90 seconds):
Where are the top 3 tenant-isolation leak risks in this architecture, and what specific guard would you place at each point?

Nathan's answer:
First, one tenant could receive another tenants data: We will add tenant_id filter to each endpoint call. Second and thrid, not sure.

Good first risk. You’re thinking in the right direction.

Score:

Clarity: 2.5/5
Correctness: 2.5/5
Tradeoffs: 1/5
Debugging readiness: 1/5
Ownership signal: 2/5
Interview-ready answer you should practice:

Retrieval leak risk (highest)
Risk: Vector search returns chunks from another tenant.
Guard: enforce mandatory tenantId metadata filter on every Vectorize query; fail closed if missing.
Storage key leak risk
Risk: wrong object/document metadata read from R2 or D1 due to unscoped keys/queries.
Guard:
R2 keys namespaced by tenant (tenantId/...)
D1 queries always include tenant scope predicate
never trust tenantId from body alone; reconcile against auth context.
Cache leak risk
Risk: cached response for tenant A served to tenant B.
Guard: cache keys must include tenant and auth scope (tenantId + role + query hash), plus short TTL and explicit invalidation rules.
Short closer line for interviews:
“We treat tenant scope as a non-optional invariant at every boundary: auth context, retrieval filters, storage keys, and cache keys.”

---

Question 4 (60-90 seconds):
Explain candidate vs parsed.data in one practical example and why that matters operationally.

Nathan's answer:
they represent the data coming in to the handler at different points in time. candidate is the object composed from the values passed in, where parsed.data is the result of safeParser, which validates the types and coerces values. This matters operationally so that we validate values passed in are correct.

Excellent. That’s interview-grade.

Score:

Clarity: 5/5
Correctness: 5/5
Tradeoffs: 3/5
Debugging readiness: 3/5
Ownership signal: 4.5/5
Small upgrade to make it even stronger:

Add one concrete coercion example (limit: "25" -> 25)
Add “single trust boundary” phrasing
Polished version:
“candidate is raw untrusted input built from query/body fields, still mostly strings. parsed.data exists only after safeParse success and is trusted, typed, and normalized. For example, limit: "25" in candidate becomes limit: 25 in parsed data. Operationally this creates a single trust boundary, prevents duplicated manual checks, and reduces bad-input bugs in downstream logic.”

---

Question 5 (90 seconds):
Give one architecture tradeoff we made that is good for enterprise clients but adds complexity for us. Explain both sides clearly.

Nathan's answer:
One important architectural trade-off we made is to create separate sync and async paths. this is important because the users experience is materially different than an admin's who uploads documents. For the user, they are querying the system and expect immediate answers, and for this reason we use sync architecture. For the admin uploading data though, there are multiple steps, and more chances for timeouts, errors, etc, and for this reason we build in a Cloudflare Queue that enqueus jobs, and implement exponential backoff, dead letter queue.

Strong answer. This is interview-credible.

Score:

Clarity: 4.5/5
Correctness: 4.5/5
Tradeoffs: 4.5/5
Debugging readiness: 3/5
Ownership signal: 4/5
One improvement:

Explicitly name the complexity cost on your side: more components, monitoring, and consistency handling.
Polished version:
“We split synchronous query and asynchronous ingest paths. Enterprise benefit: query latency stays predictable while heavy ingest workloads are decoupled and made durable with queueing, retries/backoff, and DLQ handling. Cost to us: higher system complexity, more moving parts to observe, idempotency/state management across workers, and more operational runbooks.”
