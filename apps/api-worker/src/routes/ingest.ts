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
import {
  createRequestId,
  jsonError,
  jsonResponse,
  validationErrorResponse,
} from "../lib/http";
import type { RouteContext } from "../lib/route-context";
import type { Env } from "../index";

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

  try {
    await env.INGEST_QUEUE.send(queuePayload.data);
  } catch {
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
