export type TraceStatus = "active" | "ok" | "error";
export type TracePayload = Record<string, unknown>;

export interface TraceEvent {
  requestId: string;
  stage: string;
  status: TraceStatus;
  ts: string;
  detail?: string;
  payload?: TracePayload;
}

const TRACE_TTL_MS = 10 * 60 * 1000;
const traceStore = new Map<string, TraceEvent[]>();

function pruneExpired() {
  const cutoff = Date.now() - TRACE_TTL_MS;
  for (const [requestId, events] of traceStore.entries()) {
    const latest = events[events.length - 1];
    if (!latest || Date.parse(latest.ts) < cutoff) {
      traceStore.delete(requestId);
    }
  }
}

export function appendTraceEvent(
  requestId: string,
  stage: string,
  status: TraceStatus,
  detail?: string,
  payload?: TracePayload,
): void {
  pruneExpired();
  const event: TraceEvent = {
    requestId,
    stage,
    status,
    ts: new Date().toISOString(),
    detail,
    payload,
  };

  const existing = traceStore.get(requestId) ?? [];
  existing.push(event);
  traceStore.set(requestId, existing.slice(-50));
}

export function getTraceEvents(requestId: string): TraceEvent[] {
  pruneExpired();
  return traceStore.get(requestId) ?? [];
}

export function isTraceFinished(events: TraceEvent[]): boolean {
  return events.some(
    (event) =>
      event.stage === "response_sent" ||
      event.stage === "validation_failed" ||
      event.stage === "request_failed",
  );
}
