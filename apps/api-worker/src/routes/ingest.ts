import {
  ingestRequestSchema,
  type IngestResponse,
} from "../../../../packages/shared/src";
import { createRequestId, jsonError, validationErrorResponse } from "../lib/http";
import type { Env } from "../index";

export async function handleIngest(
  request: Request,
  _env: Env,
): Promise<Response> {
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

  const parsed = ingestRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const tenant =
      rawBody && typeof rawBody === "object"
        ? (rawBody as { tenantId?: string }).tenantId
        : undefined;
    return validationErrorResponse(requestId, tenant, parsed.error);
  }

  const body = parsed.data;
  const response: IngestResponse = {
    requestId,
    tenantId: body.tenantId,
    jobId: `job_${crypto.randomUUID().slice(0, 8)}`,
    status: "queued",
  };

  return Response.json(response, { status: 202 });
}
