import { jsonResponse } from "../lib/http";
import type { RouteContext } from "../lib/route-context";

export function handleHealth(context: RouteContext): Response {
  return jsonResponse(
    {
      requestId: context.requestId,
      status: "ok",
      service: "api-worker",
    },
    200,
    context.requestId,
    "unknown",
  );
}
