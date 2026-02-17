import {
  jobsQueryParamsSchema,
  type JobsResponse,
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

export async function handleJobs(
  request: Request,
  _env: Env,
  context?: RouteContext,
): Promise<Response> {
  const requestId = context?.requestId ?? createRequestId();
  const url = new URL(request.url);

  const candidate = {
    tenantId: url.searchParams.get("tenantId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };

  const parsed = jobsQueryParamsSchema.safeParse(candidate);
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

  const allJobs = [
    {
      id: "job_8f2ca12",
      tenantId: "tenant_abc",
      stage: "index",
      status: "processing",
      attempts: 1,
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: "job_7d1ee31",
      tenantId: "tenant_delta",
      stage: "embed",
      status: "processing",
      attempts: 2,
      createdAt: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    },
    {
      id: "job_6af0c98",
      tenantId: "tenant_abc",
      stage: "complete",
      status: "completed",
      attempts: 1,
      createdAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    },
    {
      id: "job_4a2d091",
      tenantId: "tenant_omega",
      stage: "parse",
      status: "queued",
      attempts: 1,
      createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    },
  ] as const;

  const filtered = tenantScope
    ? allJobs.filter((job) => job.tenantId === tenantScope)
    : allJobs;
  const jobs = filtered.slice(0, params.limit ?? 20);

  const response: JobsResponse = {
    requestId,
    tenantId: tenantScope ?? "platform",
    jobs: [...jobs],
  };

  return jsonResponse(response, 200, requestId, response.tenantId);
}
