import {
  ingestQueueMessageSchema,
  ingestRequestSchema,
  type IngestQueueMessage,
  type IngestResponse,
} from "../../../../packages/shared/src";
import {
  enforceRoles,
  enforceTenantScope,
  requireAuthContext,
} from "../lib/auth";
import { enforceAccessJwt } from "../lib/access-jwt";
import {
  createRequestId,
  jsonError,
  jsonResponse,
  validationErrorResponse,
} from "../lib/http";
import type { RouteContext } from "../lib/route-context";
import type { Env } from "../index";

const IDEMPOTENCY_KEY_TTL_SECONDS = 60 * 60 * 24 * 7;

interface StoredIngestJobRef {
  jobId: string;
}

function buildIngestIdempotencyKey(tenantId: string, idempotencyKey: string): string {
  return `ingest:idempotency:${tenantId}:${idempotencyKey}`;
}

export async function handleIngest(
  request: Request,
  env: Env,
  context?: RouteContext,
): Promise<Response> {
  const requestId = context?.requestId ?? createRequestId();

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError(
      requestId,
      "invalid_json",
      "Request body must be valid JSON",
      400,
    );
  }

  const parsed = ingestRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const tenant =
      rawBody && typeof rawBody === "object"
        ? (rawBody as { tenantId?: string }).tenantId
        : undefined;
    return validationErrorResponse(requestId, tenant, parsed.error);
  }

  const body = parsed.data;
  const auth = requireAuthContext(request, requestId);
  if (auth instanceof Response) {
    return auth;
  }

  const accessJwtError = await enforceAccessJwt(request, requestId, env, auth.email);
  if (accessJwtError) {
    return accessJwtError;
  }

  const roleError = enforceRoles(requestId, auth, [
    "platform_admin",
    "tenant_admin",
    "service_account",
  ]);
  if (roleError) {
    return roleError;
  }

  const scopeError = enforceTenantScope(requestId, auth, body.tenantId);
  if (scopeError) {
    return scopeError;
  }

  let idempotencyStorageKey: string | undefined;
  if (body.idempotencyKey) {
    idempotencyStorageKey = buildIngestIdempotencyKey(
      body.tenantId,
      body.idempotencyKey,
    );

    const existing = await env.CACHE_KV.get(idempotencyStorageKey);
    if (existing) {
      try {
        const parsedExisting = JSON.parse(existing) as StoredIngestJobRef;
        if (typeof parsedExisting.jobId === "string" && parsedExisting.jobId.length > 0) {
          const response: IngestResponse = {
            requestId,
            tenantId: body.tenantId,
            jobId: parsedExisting.jobId,
            status: "queued",
          };
          return jsonResponse(response, 202, requestId, body.tenantId);
        }
      } catch {
        // Corrupt cached value should not block ingestion. Continue and overwrite.
      }
    }
  }

  const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;
  const queueMessage: IngestQueueMessage = {
    jobId,
    requestId,
    tenantId: body.tenantId,
    requestedBy: {
      userId: auth.userId,
      email: auth.email,
      roles: auth.roles,
    },
    document: body.document,
    idempotencyKey: body.idempotencyKey,
    requestedAt: new Date().toISOString(),
  };

  const queuePayload = ingestQueueMessageSchema.safeParse(queueMessage);
  if (!queuePayload.success) {
    return jsonError(
      requestId,
      "internal_error",
      "Failed to build ingest queue message",
      500,
      body.tenantId,
    );
  }

  if (idempotencyStorageKey) {
    const storedValue = JSON.stringify({ jobId } satisfies StoredIngestJobRef);
    try {
      await env.CACHE_KV.put(idempotencyStorageKey, storedValue, {
        expirationTtl: IDEMPOTENCY_KEY_TTL_SECONDS,
      });
    } catch {
      return jsonError(
        requestId,
        "idempotency_store_failed",
        "Failed to persist idempotency state",
        500,
        body.tenantId,
      );
    }
  }

  try {
    await env.INGEST_QUEUE.send(queuePayload.data);
  } catch {
    if (idempotencyStorageKey) {
      try {
        await env.CACHE_KV.delete(idempotencyStorageKey);
      } catch {
        // Best-effort rollback. A stale key will resolve to an existing job reference.
      }
    }
    return jsonError(
      requestId,
      "queue_publish_failed",
      "Failed to enqueue ingest job",
      500,
      body.tenantId,
    );
  }

  const response: IngestResponse = {
    requestId,
    tenantId: body.tenantId,
    jobId,
    status: "queued",
  };

  return jsonResponse(response, 202, requestId, body.tenantId);
}
