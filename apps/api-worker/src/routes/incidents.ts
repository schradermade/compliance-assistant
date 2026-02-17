import {
  incidentsQueryParamsSchema,
  type IncidentsResponse,
} from "../../../../packages/shared/src";
import {
  enforceRoles,
  enforceTenantScope,
  requireAuthContext,
} from "../lib/auth";
import {
  createRequestId,
  jsonResponse,
  validationErrorResponse,
} from "../lib/http";
import type { RouteContext } from "../lib/route-context";
import type { Env } from "../index";

export async function handleIncidents(
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
    limit: url.searchParams.get("limit") ?? undefined,
  };

  const parsed = incidentsQueryParamsSchema.safeParse(candidate);
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

  const allIncidents = [
    {
      id: "req_017fa8f2c9d",
      tenantId: "tenant_abc",
      route: "POST /query",
      code: "invalid_request",
      summary: "Missing question",
      at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      severity: "low",
    },
    {
      id: "req_017fa8f29e1",
      tenantId: "tenant_delta",
      route: "POST /ingest",
      code: "forbidden",
      summary: "Role lacks ingest permission",
      at: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
      severity: "medium",
    },
    {
      id: "req_017fa8dbe42",
      tenantId: "tenant_omega",
      route: "GET /metrics",
      code: "timeout",
      summary: "Aggregation exceeded budget",
      at: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      severity: "high",
    },
  ] as const;

  let filtered = tenantScope
    ? allIncidents.filter((incident) => incident.tenantId === tenantScope)
    : allIncidents;

  if (params.from) {
    const fromTs = Date.parse(params.from);
    if (!Number.isNaN(fromTs)) {
      filtered = filtered.filter((incident) => Date.parse(incident.at) >= fromTs);
    }
  }
  if (params.to) {
    const toTs = Date.parse(params.to);
    if (!Number.isNaN(toTs)) {
      filtered = filtered.filter((incident) => Date.parse(incident.at) <= toTs);
    }
  }

  const incidents = filtered.slice(0, params.limit ?? 20);
  const response: IncidentsResponse = {
    requestId,
    tenantId: tenantScope ?? "platform",
    incidents: [...incidents],
  };

  return jsonResponse(response, 200, requestId, response.tenantId);
}
