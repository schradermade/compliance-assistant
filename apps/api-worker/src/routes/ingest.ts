import {
  ingestRequestSchema,
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
  _env: Env,
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

  const response: IngestResponse = {
    requestId,
    tenantId: body.tenantId,
    jobId: `job_${crypto.randomUUID().slice(0, 8)}`,
    status: "queued",
  };

  return jsonResponse(response, 202, requestId, body.tenantId);
}
