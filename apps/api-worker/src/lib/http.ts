import type { ZodError } from "zod";

export function createRequestId(): string {
  return `req_${crypto.randomUUID().slice(0, 12)}`;
}

export function validationErrorResponse(
  requestId: string,
  tenantId: string | undefined,
  error: ZodError,
): Response {
  return Response.json(
    {
      requestId,
      tenantId: tenantId ?? "unknown",
      error: {
        code: "invalid_request",
        message: "Request validation failed",
        fields: error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
        })),
      },
    },
    { status: 400 },
  );
}

export function jsonError(
  requestId: string,
  code: string,
  message: string,
  status: number,
  tenantId = "unknown",
): Response {
  return Response.json(
    {
      requestId,
      tenantId,
      error: { code, message },
    },
    { status },
  );
}
