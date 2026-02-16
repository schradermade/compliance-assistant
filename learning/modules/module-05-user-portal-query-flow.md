# Module 05: User Portal Query Flow

## Objective

Understand end-user request flow and proxy boundary.

## Explain From Scratch

Explain:
- why user portal sends requests to Next `/api/query` instead of direct Worker call,
- what causes `502` in portal proxy,
- and how to validate end-to-end quickly.

## Verify Against Implementation

Review:
- `apps/user-portal/app/page.jsx`
- `apps/user-portal/app/api/query/route.js`
- `apps/user-portal/lib/api-client.js`

## Debug Drill

Scenario: `POST /api/query` returns 502.
- produce hypothesis tree and fastest confirming command for each branch.

## Pass Criteria

- can explain proxy path and CORS implications,
- can triage 502 in <= 3 minutes,
- can describe exactly where request/response transformation occurs.
