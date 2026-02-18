# Staging E2E Test Runbook

This runbook executes E2E smoke tests against the deployed staging API worker.

## Safety Guardrails

The test runner refuses to execute unless:
- `STAGING_E2E_BASE_URL` host contains `staging`,
- host does not contain `prod` or `production`,
- `STAGING_E2E_CONFIRM` equals `I_UNDERSTAND_NON_PROD_ONLY`.

## Required Environment Variables

```bash
export STAGING_E2E_BASE_URL="https://<your-staging-api-host>"
export STAGING_E2E_CONFIRM="I_UNDERSTAND_NON_PROD_ONLY"
```

Optional overrides:

```bash
export STAGING_E2E_TENANT_ID="tenant_e2e_staging"
export STAGING_E2E_USER_ID="user_e2e_runner"
export STAGING_E2E_USER_EMAIL="e2e-runner@example.com"
export STAGING_E2E_ROLES="tenant_admin"
```

## Execute

```bash
pnpm run test:e2e:staging
```

## Current Coverage

- `GET /health` responds successfully from staging API.
- `POST /ingest` accepts a valid request.
- Repeated `POST /ingest` with same `idempotencyKey` returns the same `jobId`.

## Notes

- This is a smoke test for real-cloud path validation.
- It does not yet assert downstream queue-consumer completion state in persistent job storage.
