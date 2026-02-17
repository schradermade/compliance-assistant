# User Portal

Customer-facing query console for Compliance Assistant.

## Run locally

```bash
pnpm --filter @apps/api-worker dev
API_WORKER_URL=http://127.0.0.1:8787 pnpm run dev:user
```

## Build

```bash
pnpm run build:user
```

## Notes

- Browser requests go to Next route `POST /api/query`.
- The route proxies to `${API_WORKER_URL}/query`.
- This avoids client-side CORS issues and centralizes upstream error handling.
- Upstream auth headers are set by the route from trusted server-side sources:
  - `cf-access-authenticated-user-email` (when present) maps to `x-auth-user-email`
  - `x-auth-user-id` (or `API_AUTH_USER_ID`)
  - `x-auth-user-email` (or `API_AUTH_USER_EMAIL`)
  - `x-auth-tenant-id` (or `API_AUTH_TENANT_ID`, default `tenant_abc`)
  - `x-auth-roles` (or `API_AUTH_ROLES`, default `tenant_viewer`)
- In non-dev runtime, auth env vars must be set (route fails closed with `auth_config_error` when missing).
