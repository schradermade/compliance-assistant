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
import {
  getTraceEvents,
  isTraceFinished,
  resolveTraceTenantId,
} from "../lib/trace";
import { z } from "zod";
import type { Env } from "../index";
import type { RouteContext } from "../lib/route-context";

const traceQuerySchema = z.object({
  requestId: z.string().min(1),
});

export async function handleTrace(
  request: Request,
  _env: Env,
  context?: RouteContext,
): Promise<Response> {
  const requestId = context?.requestId ?? createRequestId();
  const url = new URL(request.url);

  const candidate = {
    requestId: url.searchParams.get("requestId") ?? undefined,
  };

  const parsed = traceQuerySchema.safeParse(candidate);
  if (!parsed.success) {
    return validationErrorResponse(requestId, "unknown", parsed.error);
  }

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

  const traceRequestId = parsed.data.requestId;
  const traceEvents = getTraceEvents(traceRequestId);
  const traceTenantId = resolveTraceTenantId(traceEvents);
  if (!traceTenantId && !auth.roles.includes("platform_admin")) {
    return jsonError(
      requestId,
      "forbidden",
      "Trace tenant scope could not be resolved",
      403,
      auth.tenantId,
    );
  }
  if (traceTenantId) {
    const scopeError = enforceTenantScope(requestId, auth, traceTenantId);
    if (scopeError) {
      return scopeError;
    }
  }
  const events = traceEvents;
  const finished = isTraceFinished(events);

  return jsonResponse(
    {
      requestId,
      traceRequestId,
      events,
      finished,
    },
    200,
    requestId,
    traceTenantId ?? auth.tenantId,
  );
}
