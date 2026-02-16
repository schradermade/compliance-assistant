# Debug Labs

## Lab A: Portal 502

Given:
- user portal page loads,
- `POST /api/query` returns 502.

Task:
1. state top 3 hypotheses,
2. run one validation step per hypothesis,
3. identify root cause and fix.

## Lab B: Validation Error Drift

Given:
- dashboard filter sends params,
- API returns `invalid_request` unexpectedly.

Task:
1. inspect schema assumptions,
2. compare raw candidate vs parsed data,
3. propose minimal code fix.

## Lab C: Fallback Everywhere

Given:
- all dashboard cards show fallback mode.

Task:
1. verify route-level responses,
2. verify API base URL and env wiring,
3. isolate whether failure is endpoint, proxy, or parser.
