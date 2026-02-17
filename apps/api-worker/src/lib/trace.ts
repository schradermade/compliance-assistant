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

function getNestedValue(
  value: unknown,
  path: readonly string[],
): unknown | undefined {
  let current: unknown = value;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function parseTenantFromRawBody(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as { tenantId?: unknown };
    return typeof parsed.tenantId === "string" ? parsed.tenantId : undefined;
  } catch {
    return undefined;
  }
}

export function resolveTraceTenantId(events: TraceEvent[]): string | undefined {
  const candidatePaths: readonly (readonly string[])[] = [
    ["tenantId"],
    ["incoming", "tenantId"],
    ["outgoing", "tenantId"],
    ["incoming", "request", "tenantId"],
    ["outgoing", "request", "tenantId"],
    ["incoming", "retrievalQuery", "tenantId"],
    ["outgoing", "retrievalQuery", "tenantId"],
    ["incoming", "parsedBody", "tenantId"],
    ["outgoing", "parsedBody", "tenantId"],
    ["incoming", "candidate", "tenantId"],
    ["outgoing", "candidate", "tenantId"],
  ];

  for (const event of events) {
    const payload = event.payload;
    for (const path of candidatePaths) {
      const candidate = getNestedValue(payload, path);
      if (typeof candidate === "string" && candidate.length > 0) {
        return candidate;
      }
    }

    const bodyCandidate = getNestedValue(payload, ["incoming", "body"]);
    const tenantFromBody = parseTenantFromRawBody(bodyCandidate);
    if (tenantFromBody) {
      return tenantFromBody;
    }
  }

  return undefined;
}
