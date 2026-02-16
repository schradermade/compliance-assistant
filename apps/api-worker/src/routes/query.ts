import {
  type QueryResponse,
  queryRequestSchema,
} from '../../../../packages/shared/src';
import {
  createRequestId,
  jsonError,
  validationErrorResponse,
} from '../lib/http';
import { appendTraceEvent } from '../lib/trace';
import type { Env } from '../index';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveRequestId(request: Request): string {
  const candidate = request.headers.get("x-request-id");
  if (candidate && /^req_[a-zA-Z0-9_-]{6,64}$/.test(candidate)) {
    return candidate;
  }
  return createRequestId();
}

function questionPreview(question: string): string {
  const normalized = question.trim().replace(/\s+/g, " ");
  if (normalized.length <= 80) return normalized;
  return `${normalized.slice(0, 77)}...`;
}

function payloadFor(incoming: unknown, outgoing: unknown): Record<string, unknown> {
  return { incoming, outgoing };
}

export async function handleQuery(
  request: Request,
  _env: Env,
): Promise<Response> {
  const rawBodyText = await request.clone().text().catch(() => "");
  const requestId = resolveRequestId(request);
  appendTraceEvent(requestId, "request_received", "ok", undefined, {
    ...payloadFor(
      {
        method: request.method,
        path: new URL(request.url).pathname,
        body: rawBodyText,
      },
      {
        nextStage: "json_parse_started",
      },
    ),
  });

  let rawBody: unknown;
  try {
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
    rawBody = await request.json();
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
  } catch {
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
    return jsonError(
      requestId,
      'invalid_json',
      'Request body must be valid JSON',
      400,
    );
  }

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
  const parsed = queryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
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
          issueCount: parsed.error.issues.length,
          fields: parsed.error.issues.map((issue) => issue.path.join(".")),
        },
      ),
    );
    const tenant =
      rawBody && typeof rawBody === 'object'
        ? (rawBody as { tenantId?: string }).tenantId
        : undefined;
    return validationErrorResponse(requestId, tenant, parsed.error);
  }
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
          tenantId: parsed.data.tenantId,
          topK: parsed.data.topK ?? 5,
          question: questionPreview(parsed.data.question),
        },
      },
    ),
  );

  const body = parsed.data;
  appendTraceEvent(
    requestId,
    "retrieval_started",
    "active",
    undefined,
    payloadFor(
      {
        request: {
          tenantId: body.tenantId,
          topK: body.topK ?? 5,
          question: questionPreview(body.question),
        },
      },
      {
        retrievalQuery: {
          tenantId: body.tenantId,
          topK: body.topK ?? 5,
          filters: body.filters ?? {},
        },
      },
    ),
  );
  await sleep(220);
  appendTraceEvent(
    requestId,
    "retrieval_done",
    "ok",
    "stubbed_retrieval",
    payloadFor(
      {
        retrievalQuery: {
          tenantId: body.tenantId,
          topK: body.topK ?? 5,
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

  appendTraceEvent(
    requestId,
    "model_call_started",
    "active",
    undefined,
    payloadFor(
      {
        modelInput: {
          provider: "stubbed-provider",
          promptChars: body.question.length,
          question: questionPreview(body.question),
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
  await sleep(220);
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
          answerChars: "Stub response: query accepted & validated.".length,
        },
      },
    ),
  );

  const response: QueryResponse = {
    requestId,
    tenantId: body.tenantId,
    answer: 'Stub response: query accepted & validated.',
    citations: [],
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
    },
    latencyMs: 0,
  };
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

  return Response.json(response);
}
