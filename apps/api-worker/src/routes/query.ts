import {
  type QueryResponse,
  queryRequestSchema,
} from "../../../../packages/shared/src";
import { createRequestId, jsonError, validationErrorResponse } from "../lib/http";
import type { Env } from "../index";

export async function handleQuery(request: Request, _env: Env): Promise<Response> {
  const requestId = createRequestId();

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

  const parsed = queryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const tenant =
      rawBody && typeof rawBody === "object"
        ? (rawBody as { tenantId?: string }).tenantId
        : undefined;
    return validationErrorResponse(requestId, tenant, parsed.error);
  }

  const body = parsed.data;
  const response: QueryResponse = {
    requestId,
    tenantId: body.tenantId,
    answer: "Stub response: query accepted and validated.",
    citations: [],
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
    },
    latencyMs: 0,
  };

  return Response.json(response);
}
