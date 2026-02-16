import { createRequestId, validationErrorResponse } from "../lib/http";
import { getTraceEvents, isTraceFinished } from "../lib/trace";
import { z } from "zod";
import type { Env } from "../index";

const traceQuerySchema = z.object({
  requestId: z.string().min(1),
});

export async function handleTrace(
  request: Request,
  _env: Env,
): Promise<Response> {
  const requestId = createRequestId();
  const url = new URL(request.url);

  const candidate = {
    requestId: url.searchParams.get("requestId") ?? undefined,
  };

  const parsed = traceQuerySchema.safeParse(candidate);
  if (!parsed.success) {
    return validationErrorResponse(requestId, "unknown", parsed.error);
  }

  const events = getTraceEvents(parsed.data.requestId);
  const finished = isTraceFinished(events);

  return Response.json({
    requestId,
    traceRequestId: parsed.data.requestId,
    events,
    finished,
  });
}
