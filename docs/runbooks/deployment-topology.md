# Deployment Topology

Last updated: February 17, 2026

## Environment Layout

```mermaid
flowchart LR
  dev[Developers]
  git[GitHub]
  cf[Cloudflare]

  subgraph DEV[dev]
    d_pages[Pages: admin-pages + user-portal]
    d_api[Worker: api-worker]
    d_ingest[Worker: ingest-worker]
    d_consumer[Worker: queue-consumer]
    d_data[(R2 + D1 + KV + Vectorize + Queue)]
  end

  subgraph STG[staging]
    s_pages[Pages: admin-pages + user-portal]
    s_api[Worker: api-worker]
    s_ingest[Worker: ingest-worker]
    s_consumer[Worker: queue-consumer]
    s_data[(R2 + D1 + KV + Vectorize + Queue)]
  end

  subgraph PRD[prod]
    p_pages[Pages: admin-pages + user-portal]
    p_api[Worker: api-worker]
    p_ingest[Worker: ingest-worker]
    p_consumer[Worker: queue-consumer]
    p_data[(R2 + D1 + KV + Vectorize + Queue)]
  end

  dev --> git --> cf
  d_pages --> d_api --> d_data
  d_api --> d_ingest --> d_data
  d_api --> d_consumer --> d_data

  s_pages --> s_api --> s_data
  s_api --> s_ingest --> s_data
  s_api --> s_consumer --> s_data

  p_pages --> p_api --> p_data
  p_api --> p_ingest --> p_data
  p_api --> p_consumer --> p_data
```

## Control Points

- Tenant isolation is enforced in request contracts and storage keying (`tenantId` scope).
- Runtime infrastructure IDs are tracked in `docs/cloudflare-resources.md`.
- Secret management commands are tracked in `docs/cloudflare-secrets.md`.
- API edge routes should validate external input with zod schemas at boundaries.
