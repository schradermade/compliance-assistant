import { z } from "zod";
import type { Env } from "../index";
import {
  getTraceEvents,
  isTraceFinished,
  resolveTraceTenantId,
} from "../lib/trace";
import {
  enforceRoles,
  enforceTenantScope,
  requireAuthContext,
} from "../lib/auth";
import { enforceAccessJwt } from "../lib/access-jwt";
import { createRequestId, jsonError } from "../lib/http";
import type { RouteContext } from "../lib/route-context";

const traceQuerySchema = z.object({
  requestId: z.string().min(1),
});

export async function handleTraceStream(
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
    return jsonError(
      requestId,
      "invalid_request",
      "requestId is required",
      400,
      "unknown",
    );
  }

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

  const traceRequestId = parsed.data.requestId;
  const traceTenantId = resolveTraceTenantId(getTraceEvents(traceRequestId));
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

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      let cursor = 0;
      let heartbeatCounter = 0;

      const emit = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      emit({
        events: [],
        finished: false,
        traceRequestId,
      });

      intervalId = setInterval(() => {
        try {
          const events = getTraceEvents(traceRequestId);
          const finished = isTraceFinished(events);

          if (events.length > cursor) {
            const incremental = events.slice(cursor);
            cursor = events.length;
            emit({
              events: incremental,
              finished,
              traceRequestId,
            });
          } else {
            heartbeatCounter += 1;
            if (heartbeatCounter % 20 === 0) {
              controller.enqueue(encoder.encode(`: keepalive\n\n`));
            }
          }

          if (finished) {
            if (intervalId) clearInterval(intervalId);
            controller.close();
          }
        } catch {
          if (intervalId) clearInterval(intervalId);
          controller.error(new Error("trace_stream_failed"));
        }
      }, 120);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-request-id": requestId,
      "x-tenant-id": traceTenantId ?? auth.tenantId,
    },
  });
}
