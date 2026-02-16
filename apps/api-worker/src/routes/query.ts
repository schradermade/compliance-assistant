import {
  type QueryResponse,
  queryRequestSchema,
} from "../../../../packages/shared/src";
import {
  createRequestId,
  jsonError,
  validationErrorResponse,
} from "../lib/http";
import {
  resolveTraceRequestId,
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
): Promise<Response> {
  const rawBodyText = await request.clone().text().catch(() => "");
  const requestId = resolveTraceRequestId(request, createRequestId());

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
  return Response.json(response);
}
