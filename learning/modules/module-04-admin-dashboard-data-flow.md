# Module 04: Admin Dashboard Data Flow (Day 19)

## Objective

Explain how admin UI turns filters into endpoint calls and view models.

## Explain From Scratch

Explain:
- how tenant/range filters become endpoint query params,
- where fallback behavior is applied,
- and why page orchestration is separate from rendering components.

## Verify Against Implementation

Review:
- `apps/admin-pages/app/page.jsx`
- `apps/admin-pages/lib/dashboard/api.js`
- `apps/admin-pages/lib/dashboard/view-model.js`
- `apps/admin-pages/components/dashboard/*`

## Debug Drill

Scenario: page renders but every card shows fallback.
- list investigation steps in order from browser to upstream.

## Pass Criteria

- can trace one card's data from filter input to rendered value,
- can explain fallback policy and risk,
- can identify one place where contract drift would surface.
