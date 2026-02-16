# One-Page Runbook: Query Path 502 (Production)

## Scope

Use when end users report query failures and you see `502` on query path.

Goal:
- restore service quickly,
- isolate failing layer,
- apply safe mitigation,
- capture follow-up fixes.

## Fast Triage Sequence (1 -> 5)

### 1. Confirm user-path failure at edge

What to check:
- synthetic `POST /api/query` monitor
- route-level status trends (`/api/query`, `/query`)

Expected signal:
- query path has elevated 502 while other endpoints may still be normal.

Decision:
- if true: incident is path-specific -> continue
- if false: not broad outage -> narrow to user/session/client issues

### 2. Verify API Worker runtime health

What to check:
- worker 5xx trend, exception logs, deployment timeline

Expected signal:
- either worker exceptions (runtime regression) OR clean worker runtime.

Decision:
- worker regression: rollback/patch
- runtime clean: continue to dependency triage

### 3. Validate downstream dependencies for query

What to check:
- outbound failures/timeouts to model provider, Vectorize, D1/KV
- latency spikes (especially p95)

Expected signal:
- upstream provider timeout/auth/quota errors or binding failures.

Decision:
- enable fallback/degrade mode
- adjust timeout/retry budgets
- route to backup provider/environment if available

### 4. Verify portal proxy config and env drift

What to check:
- `API_WORKER_URL` in deployed user-portal env
- host correctness (prod vs staging/dev), DNS resolution

Expected signal:
- portal points to wrong/unreachable target while backend health appears normal.

Decision:
- correct env var + redeploy/restart portal
- add startup config validation guard

### 5. Check perimeter/security policy interference

What to check:
- Cloudflare Access/WAF/rate-limit events on query routes
- recent policy edits and edge blocks/challenges

Expected signal:
- query traffic blocked/challenged while health route remains allowed.

Decision:
- scoped temporary rule relaxation
- restore service, then fix policy conditions

## Upstream vs Downstream (Relative)

From service X perspective:
- upstream = caller of X
- downstream = service X calls

Example for query path:
- browser -> user-portal Next route (`browser` upstream to portal)
- portal -> API Worker (`worker` downstream to portal)
- worker -> model/vector/db (`model/vector/db` downstream to worker)

## Immediate Mitigation Ladder

1. Roll back recent deploy if strong correlation.
2. Enable fallback/degraded query mode.
3. Correct env/config drift and redeploy portal.
4. Temporarily relax blocking edge policy for affected route.
5. If needed, fail over to known-good environment.

## Post-Incident Checklist

- Identify exact failing layer and root cause.
- Add or improve alerts for earliest signal.
- Add regression test/guardrail for this failure mode.
- Update architecture/runbook docs with learned mitigation.
