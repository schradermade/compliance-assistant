import { ingestRequestSchema } from "../zod/ingest.schema";
import type { IngestRequest } from "../zod/ingest.schema";

export function isIngestRequest(value: unknown): value is IngestRequest {
  return ingestRequestSchema.safeParse(value).success;
}
