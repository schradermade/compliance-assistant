import assert from "node:assert/strict";
import {
  ingestQueueMessageSchema,
  type IngestQueueMessage,
} from "../../../../packages/shared/src";
import type { Env } from "../index";
import { handleIngest } from "./ingest";

function makeRequest(body: unknown): Request {
  return new Request("https://example.test/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-user-id": "user_1",
      "x-auth-user-email": "user_1@example.com",
      "x-auth-tenant-id": "tenant_abc",
      "x-auth-roles": "tenant_admin",
    },
    body: JSON.stringify(body),
  });
}

async function testIngestPublishesQueueMessage() {
  let sent: IngestQueueMessage | undefined;
  const env: Env = {
    INGEST_QUEUE: {
      async send(message: IngestQueueMessage): Promise<void> {
        sent = message;
      },
    },
  };

  const request = makeRequest({
    tenantId: "tenant_abc",
    document: {
      sourceType: "r2",
      objectKey: "tenant_abc/policies/policy.pdf",
      title: "Policy",
      tags: ["policy"],
    },
    idempotencyKey: "ingest-v1",
  });

  const response = await handleIngest(request, env, { requestId: "req_test_ingest" });
  assert.equal(response.status, 202);
  assert.equal(Boolean(sent), true);
  assert.equal(ingestQueueMessageSchema.safeParse(sent).success, true);
}

async function testIngestQueuePublishFailure() {
  const env: Env = {
    INGEST_QUEUE: {
      async send(_message: IngestQueueMessage): Promise<void> {
        throw new Error("queue_down");
      },
    },
  };

  const request = makeRequest({
    tenantId: "tenant_abc",
    document: {
      sourceType: "r2",
      objectKey: "tenant_abc/policies/policy.pdf",
      title: "Policy",
    },
  });

  const response = await handleIngest(request, env, { requestId: "req_test_ingest_fail" });
  assert.equal(response.status, 500);
  const payload = (await response.json()) as { error?: { code?: string } };
  assert.equal(payload.error?.code, "queue_publish_failed");
}

async function run() {
  await testIngestPublishesQueueMessage();
  await testIngestQueuePublishFailure();
  console.log("ingest.test.ts: ok");
}

run();
