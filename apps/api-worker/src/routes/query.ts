import {
  type QueryResponse,
  queryRequestSchema,
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
import {
  traceInvalidJson,
  traceJsonParsed,
  traceJsonParseStarted,
  traceModelCallDone,
  traceModelCallStarted,
  traceRequestReceived,
  traceResponseSent,
  traceRetrievalDone,
  traceRetrievalStarted,
  traceValidated,
  traceValidationFailed,
  traceValidationStarted,
} from "../lib/query-trace";
import type { Env } from "../index";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function handleQuery(
  request: Request,
  _env: Env,
  context?: RouteContext,
): Promise<Response> {
  const rawBodyText = await request.clone().text().catch(() => "");
  const requestId = context?.requestId ?? createRequestId();

  traceRequestReceived(requestId, request, rawBodyText);

  let rawBody: unknown;
  try {
    traceJsonParseStarted(requestId, rawBodyText);
    rawBody = await request.json();
    traceJsonParsed(requestId, rawBodyText, rawBody);
  } catch {
    traceInvalidJson(requestId, rawBodyText);
    return jsonError(
      requestId,
      "invalid_json",
      "Request body must be valid JSON",
      400,
    );
  }

  traceValidationStarted(requestId, rawBody);
  const parsed = queryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    traceValidationFailed(
      requestId,
      rawBody,
      parsed.error.issues.length,
      parsed.error.issues.map((issue) => issue.path.join(".")),
    );

    const tenant =
      rawBody && typeof rawBody === "object"
        ? (rawBody as { tenantId?: string }).tenantId
        : undefined;

    return validationErrorResponse(requestId, tenant, parsed.error);
  }

  const body = parsed.data;
  traceValidated(requestId, rawBody, body);

  const auth = requireAuthContext(request, requestId);
  if (auth instanceof Response) {
    return auth;
  }

  const accessJwtError = await enforceAccessJwt(request, requestId, _env, auth.email);
  if (accessJwtError) {
    return accessJwtError;
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

  const scopeError = enforceTenantScope(requestId, auth, body.tenantId);
  if (scopeError) {
    return scopeError;
  }

  traceRetrievalStarted(requestId, body);
  await sleep(220);
  traceRetrievalDone(requestId, body);

  traceModelCallStarted(requestId, body);
  await sleep(220);

  const answer = "Stub response: query accepted & validated.";
  traceModelCallDone(requestId, answer);

  const response: QueryResponse = {
    requestId,
    tenantId: body.tenantId,
    answer,
    citations: [],
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
    },
    latencyMs: 0,
  };

  traceResponseSent(requestId, response);
  return jsonResponse(response, 200, requestId, body.tenantId);
}
