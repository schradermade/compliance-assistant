import { z } from "zod";
import type { Env } from "../index";
import { getTraceEvents, isTraceFinished } from "../lib/trace";

const traceQuerySchema = z.object({
  requestId: z.string().min(1),
});

export async function handleTraceStream(
  request: Request,
  _env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const candidate = {
    requestId: url.searchParams.get("requestId") ?? undefined,
  };

  const parsed = traceQuerySchema.safeParse(candidate);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "invalid_request",
          message: "requestId is required",
        },
      },
      { status: 400 },
    );
  }

  const traceRequestId = parsed.data.requestId;
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
    },
  });
}
