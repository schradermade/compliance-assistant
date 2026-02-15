# Cloudflare Secrets Setup

Set secrets per Worker and environment. Example below uses `OPENAI_API_KEY`.

## API Worker

```bash
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/api-worker/wrangler.toml
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/api-worker/wrangler.toml --env staging
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/api-worker/wrangler.toml --env prod
```

## Ingest Worker

```bash
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/ingest-worker/wrangler.toml
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/ingest-worker/wrangler.toml --env staging
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/ingest-worker/wrangler.toml --env prod
```

## Suggested additional secrets

- `MODEL_API_KEY` (if separate from OpenAI key)
- `JWT_SIGNING_SECRET` (if self-managed token signing is introduced)
- `WEBHOOK_SIGNING_SECRET` (if inbound webhooks are added)
