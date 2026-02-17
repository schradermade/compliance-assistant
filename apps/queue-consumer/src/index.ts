import { ingestQueueMessageSchema } from "../../../packages/shared/src";
import { chunkDocument } from "../../ingest-worker/src/processors/chunk";
import { embedChunks } from "../../ingest-worker/src/processors/embed";
import { indexEmbeddings } from "../../ingest-worker/src/processors/index";
import { parseDocument } from "../../ingest-worker/src/processors/parse";

export interface Env {}

interface QueueMessage {
  id?: string;
  body: unknown;
  ack: () => void;
}

interface QueueBatch {
  messages: QueueMessage[];
}

function assertTenantScopedObjectKey(tenantId: string, objectKey: string): void {
  if (!objectKey.startsWith(`${tenantId}/`)) {
    throw new Error("tenant_scope_mismatch");
  }
}

async function runParseStage(jobId: string, raw: string): Promise<string> {
  const parsed = parseDocument(raw);
  console.log(
    JSON.stringify({
      level: "info",
      event: "ingest_stage_complete",
      jobId,
      stage: "parse",
    }),
  );
  return parsed;
}

async function runChunkStage(jobId: string, text: string): Promise<string[]> {
  const chunks = chunkDocument(text);
  console.log(
    JSON.stringify({
      level: "info",
      event: "ingest_stage_complete",
      jobId,
      stage: "chunk",
    }),
  );
  return chunks;
}

async function runEmbedStage(
  jobId: string,
  chunks: string[],
): Promise<number[][]> {
  const vectors = await embedChunks(chunks);
  console.log(
    JSON.stringify({
      level: "info",
      event: "ingest_stage_complete",
      jobId,
      stage: "embed",
    }),
  );
  return vectors;
}

async function runIndexStage(jobId: string, vectors: number[][]): Promise<void> {
  await indexEmbeddings(vectors);
  console.log(
    JSON.stringify({
      level: "info",
      event: "ingest_stage_complete",
      jobId,
      stage: "index",
    }),
  );
}

export default {
  async queue(batch: QueueBatch, _env: Env): Promise<void> {
    for (const message of batch.messages) {
      const parsed = ingestQueueMessageSchema.safeParse(message.body);

      if (!parsed.success) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "ingest_message_invalid",
            queueMessageId: message.id ?? "unknown",
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              code: issue.code,
              message: issue.message,
            })),
          }),
        );
        message.ack();
        continue;
      }

      const payload = parsed.data;
      console.log(
        JSON.stringify({
          level: "info",
          event: "ingest_job_started",
          queueMessageId: message.id ?? "unknown",
          requestId: payload.requestId,
          jobId: payload.jobId,
          tenantId: payload.tenantId,
        }),
      );

      try {
        assertTenantScopedObjectKey(payload.tenantId, payload.document.objectKey);

        const parsedDocument = await runParseStage(
          payload.jobId,
          `${payload.document.title}\n${payload.document.objectKey}`,
        );
        const chunks = await runChunkStage(payload.jobId, parsedDocument);
        const vectors = await runEmbedStage(payload.jobId, chunks);
        await runIndexStage(payload.jobId, vectors);

        console.log(
          JSON.stringify({
            level: "info",
            event: "ingest_job_completed",
            requestId: payload.requestId,
            jobId: payload.jobId,
            tenantId: payload.tenantId,
          }),
        );
        message.ack();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("unknown_error");
        console.error(
          JSON.stringify({
            level: "error",
            event: "ingest_job_failed",
            requestId: payload.requestId,
            jobId: payload.jobId,
            tenantId: payload.tenantId,
            message: err.message,
            stack: err.stack,
          }),
        );
        // Do not ack failures so the queue can retry delivery.
      }
    }
  },
};
