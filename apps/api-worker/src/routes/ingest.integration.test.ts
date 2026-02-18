import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

function ingestHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-auth-user-id": "user_1",
    "x-auth-user-email": "user_1@example.com",
    "x-auth-tenant-id": "tenant_abc",
    "x-auth-roles": "tenant_admin",
  };
}

function ingestBody(idempotencyKey: string): string {
  return JSON.stringify({
    tenantId: "tenant_abc",
    document: {
      sourceType: "r2",
      objectKey: "tenant_abc/policies/policy.pdf",
      title: "Policy",
      tags: ["policy"],
    },
    idempotencyKey,
  });
}

describe("POST /ingest integration", () => {
  it("returns 202 and reuses jobId for duplicate idempotency requests", async () => {
    const key = `integration-${crypto.randomUUID()}`;

    const first = await SELF.fetch("https://example.test/ingest", {
      method: "POST",
      headers: ingestHeaders(),
      body: ingestBody(key),
    });
    expect(first.status).toBe(202);
    const firstJson = (await first.json()) as { jobId?: string };
    expect(typeof firstJson.jobId).toBe("string");

    const second = await SELF.fetch("https://example.test/ingest", {
      method: "POST",
      headers: ingestHeaders(),
      body: ingestBody(key),
    });
    expect(second.status).toBe(202);
    const secondJson = (await second.json()) as { jobId?: string };
    expect(secondJson.jobId).toBe(firstJson.jobId);
  });

  it("returns 400 for invalid request body", async () => {
    const response = await SELF.fetch("https://example.test/ingest", {
      method: "POST",
      headers: ingestHeaders(),
      body: JSON.stringify({
        tenantId: "tenant_abc",
        document: {
          sourceType: "r2",
          objectKey: 42,
          title: "Policy",
        },
      }),
    });

    expect(response.status).toBe(400);
  });
});
