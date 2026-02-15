import {
  jobsQueryParamsSchema,
  type JobsResponse,
} from "../../../../packages/shared/src";
import { createRequestId, validationErrorResponse } from "../lib/http";
import type { Env } from "../index";

export async function handleJobs(request: Request, _env: Env): Promise<Response> {
  const requestId = createRequestId();
  const url = new URL(request.url);

  const candidate = {
    tenantId: url.searchParams.get("tenantId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };

  const parsed = jobsQueryParamsSchema.safeParse(candidate);
  if (!parsed.success) {
    return validationErrorResponse(requestId, candidate.tenantId, parsed.error);
  }

  const params = parsed.data;
  const allJobs = [
    {
      id: "job_8f2ca12",
      tenantId: "tenant_abc",
      stage: "index",
      status: "processing",
      attempts: 1,
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: "job_7d1ee31",
      tenantId: "tenant_delta",
      stage: "embed",
      status: "processing",
      attempts: 2,
      createdAt: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    },
    {
      id: "job_6af0c98",
      tenantId: "tenant_abc",
      stage: "complete",
      status: "completed",
      attempts: 1,
      createdAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    },
    {
      id: "job_4a2d091",
      tenantId: "tenant_omega",
      stage: "parse",
      status: "queued",
      attempts: 1,
      createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    },
  ] as const;

  const filtered = params.tenantId
    ? allJobs.filter((job) => job.tenantId === params.tenantId)
    : allJobs;
  const jobs = filtered.slice(0, params.limit ?? 20);

  const response: JobsResponse = {
    requestId,
    tenantId: params.tenantId ?? "platform",
    jobs: [...jobs],
  };

  return Response.json(response);
}
