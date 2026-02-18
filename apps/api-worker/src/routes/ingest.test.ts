import { describe, expect, it } from "vitest";
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

describe("handleIngest", () => {
  it("publishes a valid queue message", async () => {
    let sent: IngestQueueMessage | undefined;
    const kv = new Map<string, string>();
    const env: Env = {
      INGEST_QUEUE: {
        async send(message: IngestQueueMessage): Promise<void> {
          sent = message;
        },
      },
      CACHE_KV: {
        async get(key: string): Promise<string | null> {
          return kv.get(key) ?? null;
        },
        async put(key: string, value: string): Promise<void> {
          kv.set(key, value);
        },
        async delete(key: string): Promise<void> {
          kv.delete(key);
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

    const response = await handleIngest(request, env, {
      requestId: "req_test_ingest",
    });
    expect(response.status).toBe(202);
    expect(Boolean(sent)).toBe(true);
    expect(ingestQueueMessageSchema.safeParse(sent).success).toBe(true);
  });

  it("returns 500 when queue publish fails", async () => {
    const kv = new Map<string, string>();
    const env: Env = {
      INGEST_QUEUE: {
        async send(_message: IngestQueueMessage): Promise<void> {
          throw new Error("queue_down");
        },
      },
      CACHE_KV: {
        async get(key: string): Promise<string | null> {
          return kv.get(key) ?? null;
        },
        async put(key: string, value: string): Promise<void> {
          kv.set(key, value);
        },
        async delete(key: string): Promise<void> {
          kv.delete(key);
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

    const response = await handleIngest(request, env, {
      requestId: "req_test_ingest_fail",
    });
    expect(response.status).toBe(500);
    const payload = (await response.json()) as { error?: { code?: string } };
    expect(payload.error?.code).toBe("queue_publish_failed");
  });

  it("returns same job id for duplicate idempotency key without republish", async () => {
    const kv = new Map<string, string>();
    const sent: IngestQueueMessage[] = [];
    const env: Env = {
      INGEST_QUEUE: {
        async send(message: IngestQueueMessage): Promise<void> {
          sent.push(message);
        },
      },
      CACHE_KV: {
        async get(key: string): Promise<string | null> {
          return kv.get(key) ?? null;
        },
        async put(key: string, value: string): Promise<void> {
          kv.set(key, value);
        },
        async delete(key: string): Promise<void> {
          kv.delete(key);
        },
      },
    };

    const body = {
      tenantId: "tenant_abc",
      document: {
        sourceType: "r2" as const,
        objectKey: "tenant_abc/policies/policy.pdf",
        title: "Policy",
      },
      idempotencyKey: "ingest-v1",
    };

    const first = await handleIngest(makeRequest(body), env, {
      requestId: "req_test_ingest_1",
    });
    const second = await handleIngest(makeRequest(body), env, {
      requestId: "req_test_ingest_2",
    });

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(sent.length).toBe(1);

    const firstBody = (await first.json()) as { jobId: string };
    const secondBody = (await second.json()) as { jobId: string };
    expect(secondBody.jobId).toBe(firstBody.jobId);
  });
});
