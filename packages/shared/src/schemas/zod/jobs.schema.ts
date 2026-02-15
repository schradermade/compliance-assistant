import { z } from "zod";
import type { RequestMeta } from "../common";

export const jobsStatusSchema = z.union([
  z.literal("queued"),
  z.literal("processing"),
  z.literal("completed"),
  z.literal("failed"),
]);

export const jobsQueryParamsSchema = z.object({
  tenantId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type JobsQueryParams = z.infer<typeof jobsQueryParamsSchema>;

export interface IngestionJob {
  id: string;
  tenantId: string;
  stage: "parse" | "chunk" | "embed" | "index" | "complete";
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  createdAt: string;
}

export interface JobsResponse extends RequestMeta {
  jobs: IngestionJob[];
}
