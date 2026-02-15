import { z } from "zod";
import type { RequestMeta } from "../common";

export const ingestRequestSchema = z.object({
  tenantId: z.string().min(1),
  document: z.object({
    sourceType: z.literal("r2"),
    objectKey: z.string().min(1),
    title: z.string().min(1),
    tags: z.array(z.string()).optional(),
  }),
  idempotencyKey: z.string().min(1).optional(),
});

export type IngestRequest = z.infer<typeof ingestRequestSchema>;

export interface IngestResponse extends RequestMeta {
  jobId: string;
  status: "queued" | "processing" | "failed" | "completed";
}
