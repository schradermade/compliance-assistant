# Cloudflare Secrets Setup

Set secrets per Worker and environment. Example below uses `OPENAI_API_KEY`.

## API Worker

```bash
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/api-worker/wrangler.toml
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/api-worker/wrangler.toml --env staging
pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/api-worker/wrangler.toml --env prod
pnpm dlx wrangler secret put CF_ACCESS_AUD --config apps/api-worker/wrangler.toml --env staging
pnpm dlx wrangler secret put CF_ACCESS_AUD --config apps/api-worker/wrangler.toml --env prod
pnpm dlx wrangler secret put CF_ACCESS_ISSUER --config apps/api-worker/wrangler.toml --env staging
pnpm dlx wrangler secret put CF_ACCESS_ISSUER --config apps/api-worker/wrangler.toml --env prod
pnpm dlx wrangler secret put CF_ACCESS_JWKS_URL --config apps/api-worker/wrangler.toml --env staging
pnpm dlx wrangler secret put CF_ACCESS_JWKS_URL --config apps/api-worker/wrangler.toml --env prod
```

Optional hard-enforcement toggle (recommended for staging/prod after config is in place):

```toml
[env.staging.vars]
REQUIRE_ACCESS_JWT = "1"

[env.prod.vars]
REQUIRE_ACCESS_JWT = "1"
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
