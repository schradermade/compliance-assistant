import {
  metricsQueryParamsSchema,
  type MetricsResponse,
} from "../../../../packages/shared/src";
import { createRequestId, validationErrorResponse } from "../lib/http";
import type { Env } from "../index";

export async function handleMetrics(
  request: Request,
  _env: Env,
): Promise<Response> {
  const requestId = createRequestId();
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
  const response: MetricsResponse = {
    requestId,
    tenantId: params.tenantId ?? "platform",
    scope: {
      tenantId: params.tenantId,
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

  return Response.json(response);
}
