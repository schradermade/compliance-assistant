import { Hono } from 'hono';
export { RateLimiter } from './durable/rate-limiter';
import { createRequestId, jsonError } from './lib/http';
import { handleHealth } from './routes/health';
import { handleIngest } from './routes/ingest';
import { handleIncidents } from './routes/incidents';
import { handleJobs } from './routes/jobs';
import { handleMetrics } from './routes/metrics';
import { handleQuery } from './routes/query';
import { handleTrace } from './routes/trace';
import { handleTraceStream } from './routes/trace-stream';
import type { IngestQueueMessage } from '../../../packages/shared/src';

export interface Env {
  INGEST_QUEUE: IngestQueueBinding;
}

interface IngestQueueBinding {
  send(message: IngestQueueMessage): Promise<void>;
}

interface RequestContextVars {
  requestId: string;
  clientRequestId?: string;
}

const app = new Hono<{ Bindings: Env; Variables: RequestContextVars }>();

app.use('*', async (c, next) => {
  const requestId = createRequestId();
  const clientRequestId = c.req.header('x-request-id')?.trim() || undefined;
  c.set('requestId', requestId);
  c.set('clientRequestId', clientRequestId);

  const startedAt = Date.now();
  await next();
  const latencyMs = Date.now() - startedAt;

  const route = `${c.req.method} ${new URL(c.req.url).pathname}`;
  const tenantId =
    c.res.headers.get('x-tenant-id') ??
    c.req.header('x-auth-tenant-id') ??
    'unknown';
  const status = c.res.status;
  const outcome = status >= 500 ? 'error' : status >= 400 ? 'rejected' : 'ok';
  c.res.headers.set('x-request-id', requestId);

  console.log(
    JSON.stringify({
      level: 'info',
      event: 'api_request',
      requestId,
      tenantId,
      route,
      status,
      outcome,
      latencyMs,
      clientRequestId,
    }),
  );
});

app.onError((error, c) => {
  const requestId = c.get('requestId') || createRequestId();
  const tenantId = c.req.header('x-auth-tenant-id') || 'unknown';
  const route = `${c.req.method} ${new URL(c.req.url).pathname}`;

  console.error(
    JSON.stringify({
      level: 'error',
      event: 'api_unhandled_error',
      requestId,
      tenantId,
      route,
      message: error.message,
      name: error.name,
      stack: error.stack,
    }),
  );

  return jsonError(
    requestId,
    'internal_error',
    'Unexpected server error',
    500,
    tenantId,
  );
});

app.get('/health', (c) => handleHealth({ requestId: c.get('requestId') }));
app.post('/query', (c) =>
  handleQuery(c.req.raw, c.env, {
    requestId: c.get('requestId'),
  }),
);
app.post('/ingest', (c) =>
  handleIngest(c.req.raw, c.env, {
    requestId: c.get('requestId'),
  }),
);
app.get('/metrics', (c) =>
  handleMetrics(c.req.raw, c.env, {
    requestId: c.get('requestId'),
  }),
);
app.get('/jobs', (c) =>
  handleJobs(c.req.raw, c.env, {
    requestId: c.get('requestId'),
  }),
);
app.get('/incidents', (c) =>
  handleIncidents(c.req.raw, c.env, {
    requestId: c.get('requestId'),
  }),
);
app.get('/trace', (c) =>
  handleTrace(c.req.raw, c.env, {
    requestId: c.get('requestId'),
  }),
);
app.get('/trace/stream', (c) =>
  handleTraceStream(c.req.raw, c.env, {
    requestId: c.get('requestId'),
  }),
);

app.notFound((c) => {
  const requestId = c.get('requestId') || createRequestId();
  const tenantId = c.req.header('x-auth-tenant-id') || 'unknown';
  return jsonError(requestId, 'not_found', 'Route not found', 404, tenantId);
});

export default app;
