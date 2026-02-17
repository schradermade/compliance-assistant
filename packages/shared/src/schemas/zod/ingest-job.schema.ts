import { z } from "zod";
import { ingestDocumentSchema } from "./ingest.schema";

export const ingestJobActorSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  roles: z.array(z.string().min(1)).min(1),
});

export const ingestQueueMessageSchema = z.object({
  jobId: z.string().min(1),
  requestId: z.string().min(1),
  tenantId: z.string().min(1),
  requestedBy: ingestJobActorSchema,
  document: ingestDocumentSchema,
  idempotencyKey: z.string().min(1).optional(),
  requestedAt: z.iso.datetime(),
});

export type IngestJobActor = z.infer<typeof ingestJobActorSchema>;
export type IngestQueueMessage = z.infer<typeof ingestQueueMessageSchema>;
