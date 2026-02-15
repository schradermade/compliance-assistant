# Cloudflare Resource Inventory

Provisioned on 2026-02-15 for account `2a49cc296188fe3b7e3c33e98f1d4cd2`.

## KV Namespaces

| Environment | Name | ID |
|---|---|---|
| dev | `compliance-cache-dev` | `307a6a51500c44549d6eaec2a1a81188` |
| staging | `compliance-cache-staging` | `f5ebdbf8d962494194fb3d84cb2a586b` |
| prod | `compliance-cache-prod` | `03da6132ed65466680651ac191dfaa4b` |

## D1 Databases

| Environment | Name | Database ID |
|---|---|---|
| dev | `compliance-dev` | `11f10559-222b-493c-bb74-a28b247cf273` |
| staging | `compliance-staging` | `0973e44e-1cad-4861-a552-3c07063b6537` |
| prod | `compliance-prod` | `868eb001-dea3-4b7a-86ff-f5a797f8d7db` |

## R2 Buckets

- `compliance-docs-dev`
- `compliance-docs-staging`
- `compliance-docs-prod`

## Queues

- `compliance-ingest-dev`
- `compliance-ingest-staging`
- `compliance-ingest-prod`

## Vectorize Indexes

- `compliance-dev-index` (1536, cosine)
- `compliance-staging-index` (1536, cosine)
- `compliance-prod-index` (1536, cosine)

## Notes

- `apps/api-worker/wrangler.toml` and `apps/ingest-worker/wrangler.toml` are patched with real D1/KV IDs.
- `apps/api-worker/wrangler.toml` includes Durable Object migration tag `v1` for `RateLimiter`.
- Secrets are not set by this document; configure with `wrangler secret put` per environment.
