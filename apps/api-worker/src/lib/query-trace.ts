import type { QueryRequest, QueryResponse } from "../../../../packages/shared/src";
import { appendTraceEvent } from "./trace";

function payloadFor(incoming: unknown, outgoing: unknown): Record<string, unknown> {
  return { incoming, outgoing };
}

function questionPreview(question: string): string {
  const normalized = question.trim().replace(/\s+/g, " ");
  if (normalized.length <= 80) return normalized;
  return `${normalized.slice(0, 77)}...`;
}

export function resolveTraceRequestId(
  request: Request,
  fallbackRequestId: string,
): string {
  const candidate = request.headers.get("x-request-id");
  if (candidate && /^req_[a-zA-Z0-9_-]{6,64}$/.test(candidate)) {
    return candidate;
  }
  return fallbackRequestId;
}

export function traceRequestReceived(
  requestId: string,
  request: Request,
  rawBodyText: string,
): void {
  appendTraceEvent(
    requestId,
    "request_received",
    "ok",
    undefined,
    payloadFor(
      {
        method: request.method,
        path: new URL(request.url).pathname,
        body: rawBodyText,
      },
      {
        nextStage: "json_parse_started",
      },
    ),
  );
}

export function traceJsonParseStarted(requestId: string, rawBodyText: string): void {
  appendTraceEvent(
    requestId,
    "json_parse_started",
    "active",
    undefined,
    payloadFor(
      {
        body: rawBodyText,
      },
      {
        parser: "request.json",
      },
    ),
  );
}

export function traceJsonParsed(
  requestId: string,
  rawBodyText: string,
  rawBody: unknown,
): void {
  appendTraceEvent(
    requestId,
    "json_parsed",
    "ok",
    undefined,
    payloadFor(
      {
        rawBody: rawBodyText,
      },
      {
        parsedBody: rawBody,
        bodyType: typeof rawBody,
      },
    ),
  );
}

export function traceInvalidJson(requestId: string, rawBodyText: string): void {
  appendTraceEvent(
    requestId,
    "request_failed",
    "error",
    "invalid_json",
    payloadFor(
      {
        body: rawBodyText,
      },
      {
        error: "Request body was not valid JSON",
      },
    ),
  );
}

export function traceValidationStarted(requestId: string, rawBody: unknown): void {
  appendTraceEvent(
    requestId,
    "validation_started",
    "active",
    undefined,
    payloadFor(
      {
        parsedBody: rawBody,
      },
      {
        schema: "queryRequestSchema",
      },
    ),
  );
}

export function traceValidationFailed(
  requestId: string,
  rawBody: unknown,
  issueCount: number,
  fields: string[],
): void {
  appendTraceEvent(
    requestId,
    "validation_failed",
    "error",
    undefined,
    payloadFor(
      {
        parsedBody: rawBody,
      },
      {
        issueCount,
        fields,
      },
    ),
  );
}

export function traceValidated(
  requestId: string,
  rawBody: unknown,
  request: QueryRequest,
): void {
  appendTraceEvent(
    requestId,
    "validated",
    "ok",
    undefined,
    payloadFor(
      {
        candidate: rawBody,
      },
      {
        request: {
          tenantId: request.tenantId,
          topK: request.topK ?? 5,
          question: questionPreview(request.question),
        },
      },
    ),
  );
}

export function traceRetrievalStarted(
  requestId: string,
  request: QueryRequest,
): void {
  appendTraceEvent(
    requestId,
    "retrieval_started",
    "active",
    undefined,
    payloadFor(
      {
        request: {
          tenantId: request.tenantId,
          topK: request.topK ?? 5,
          question: questionPreview(request.question),
        },
      },
      {
        retrievalQuery: {
          tenantId: request.tenantId,
          topK: request.topK ?? 5,
          filters: request.filters ?? {},
        },
      },
    ),
  );
}

export function traceRetrievalDone(
  requestId: string,
  request: QueryRequest,
): void {
  appendTraceEvent(
    requestId,
    "retrieval_done",
    "ok",
    "stubbed_retrieval",
    payloadFor(
      {
        retrievalQuery: {
          tenantId: request.tenantId,
          topK: request.topK ?? 5,
        },
      },
      {
        retrievalResult: {
          retrievedChunks: 0,
          citationsCandidate: 0,
        },
      },
    ),
  );
}

export function traceModelCallStarted(
  requestId: string,
  request: QueryRequest,
): void {
  appendTraceEvent(
    requestId,
    "model_call_started",
    "active",
    undefined,
    payloadFor(
      {
        modelInput: {
          provider: "stubbed-provider",
          promptChars: request.question.length,
          question: questionPreview(request.question),
        },
      },
      {
        outboundModelRequest: {
          provider: "stubbed-provider",
          mode: "chat",
        },
      },
    ),
  );
}

export function traceModelCallDone(requestId: string, answer: string): void {
  appendTraceEvent(
    requestId,
    "model_call_done",
    "ok",
    "stubbed_model",
    payloadFor(
      {
        outboundModelRequest: {
          provider: "stubbed-provider",
          mode: "chat",
        },
      },
      {
        modelResponse: {
          answerChars: answer.length,
        },
      },
    ),
  );
}

export function traceResponseSent(
  requestId: string,
  response: QueryResponse,
): void {
  appendTraceEvent(
    requestId,
    "response_sent",
    "ok",
    undefined,
    payloadFor(
      {
        responseBody: response,
      },
      {
        http: {
          statusCode: 200,
          contentType: "application/json",
        },
      },
    ),
  );
}
