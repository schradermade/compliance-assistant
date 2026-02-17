import {
  metricsQueryParamsSchema,
  type MetricsResponse,
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

export async function handleMetrics(
  request: Request,
  _env: Env,
  context?: RouteContext,
): Promise<Response> {
  const requestId = context?.requestId ?? createRequestId();
  const url = new URL(request.url);

  const candidate = {
    tenantId: url.searchParams.get("tenantId") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    granularity: url.searchParams.get("granularity") ?? undefined,
  };

  const parsed = metricsQueryParamsSchema.safeParse(candidate);
  if (!parsed.success) {
    return validationErrorResponse(requestId, candidate.tenantId, parsed.error);
  }

  const params = parsed.data;
  const auth = requireAuthContext(request, requestId);
  if (auth instanceof Response) {
    return auth;
  }

  const roleError = enforceRoles(requestId, auth, [
    "platform_admin",
    "tenant_admin",
    "tenant_analyst",
    "tenant_viewer",
    "service_account",
  ]);
  if (roleError) {
    return roleError;
  }

  let tenantScope = params.tenantId;
  if (tenantScope) {
    const scopeError = enforceTenantScope(requestId, auth, tenantScope);
    if (scopeError) {
      return scopeError;
    }
  } else if (!auth.roles.includes("platform_admin")) {
    tenantScope = auth.tenantId;
  }

  if (!tenantScope && !auth.roles.includes("platform_admin")) {
    return jsonError(
      requestId,
      "forbidden",
      "Tenant scope is required for this identity",
      403,
      auth.tenantId,
    );
  }

  const response: MetricsResponse = {
    requestId,
    tenantId: tenantScope ?? "platform",
    scope: {
      tenantId: tenantScope,
      from: params.from,
      to: params.to,
      granularity: params.granularity ?? "1h",
    },
    metrics: {
      requests: 0,
      successRate: 1,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
      cacheHitRate: 0,
      throttleEvents: 0,
    },
  };

  return jsonResponse(response, 200, requestId, response.tenantId);
}
