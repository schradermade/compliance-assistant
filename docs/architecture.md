# System Architecture

This document defines the Cloudflare-native system architecture for the Compliance Assistant platform.

## Overview

The system is designed around:
- edge API execution on Cloudflare Workers,
- asynchronous ingestion with Queues,
- tenant-aware retrieval using Vectorize,
- enterprise access control via Cloudflare Access (OIDC/SAML),
- operational telemetry and audit events in D1/log streams.

## Architecture Diagram

```mermaid
flowchart LR
  user[End User]
  admin[Admin User]
  idp[Enterprise IdP<br/>OIDC/SAML]
  access[Cloudflare Access]
  pages[Cloudflare Pages<br/>Admin Dashboard]
  api[API Worker<br/>Query + Metrics + AuthZ]
  queue[Cloudflare Queues]
  ingest[Ingest Worker / Consumer]
  r2[(R2<br/>Documents)]
  vec[(Vectorize<br/>Embeddings Index)]
  d1[(D1<br/>Tenant + Audit + Metadata)]
  kv[(KV<br/>Cache + Flags)]
  do[(Durable Objects<br/>Rate Limiter)]
  llm[Model Provider<br/>Chat + Embeddings]
  logs[Logs/Analytics]

  user --> access
  admin --> access
  access --> idp
  access --> pages
  access --> api

  pages --> api

  api --> do
  api --> kv
  api --> d1
  api --> vec
  api --> llm
  api --> logs

  admin -->|Upload docs| api
  api --> r2
  api -. enqueue .-> queue
  queue -. consume .-> ingest
  ingest --> r2
  ingest --> llm
  ingest --> vec
  ingest --> d1
  ingest --> logs

  vec --> api
  d1 --> pages
  d1 --> api

  subgraph legend[Legend]
    l1[Cloudflare Managed]
    l2[External Provider]
    l3[Human Actor]
    l4[Cloudflare Security Control]
  end

  classDef cf fill:#FFF4E5,stroke:#F97316,stroke-width:1.5px,color:#7C2D12;
  classDef cfSec fill:#FFE8D6,stroke:#EA580C,stroke-width:2.5px,color:#7C2D12;
  classDef ext fill:#EEF2FF,stroke:#4F46E5,stroke-width:1.5px,color:#1E1B4B;
  classDef human fill:#F3F4F6,stroke:#6B7280,stroke-width:1.5px,color:#111827;

  class api,pages,ingest,queue,r2,vec,d1,kv,logs cf;
  class access,do cfSec;
  class idp,llm ext;
  class user,admin human;
  class l1 cf;
  class l2 ext;
  class l3 human;
  class l4 cfSec;
```

## Request Flow (Query)

1. User authenticates via Cloudflare Access (backed by OIDC/SAML IdP).
2. API Worker validates tenant + role and applies rate limiting via Durable Objects.
3. API Worker checks KV cache, then performs retrieval against Vectorize.
4. API Worker calls the model provider with grounded context.
5. API Worker returns answer + citations and emits metrics/audit events.

## Ingestion Flow

1. Admin uploads source documents through API.
2. API writes file/object metadata to R2 and D1.
3. API enqueues ingestion task to Cloudflare Queues.
4. Ingest worker chunks documents, generates embeddings, and updates Vectorize.
5. Ingest worker records status and audit trails in D1.
