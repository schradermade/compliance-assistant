import { describe, expect, it } from "vitest";
import { buildAuthHeaders, getStagingConfigFromEnv } from "./staging-guards";

interface IngestResponseBody {
  requestId?: string;
  tenantId?: string;
  jobId?: string;
  status?: string;
}

describe("staging ingest E2E", () => {
  it("accepts ingest and reuses jobId for duplicate idempotency key", async () => {
    const config = getStagingConfigFromEnv();
    const headers = buildAuthHeaders(config);

    const health = await fetch(`${config.baseUrl}/health`);
    expect(health.status).toBe(200);

    const idempotencyKey = `e2e-${Date.now()}-${crypto.randomUUID()}`;
    const body = {
      tenantId: config.tenantId,
      document: {
        sourceType: "r2",
        objectKey: `${config.tenantId}/e2e/${idempotencyKey}.pdf`,
        title: "E2E Test Document",
        tags: ["e2e", "staging"],
      },
      idempotencyKey,
    };

    const first = await fetch(`${config.baseUrl}/ingest`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    expect(first.status).toBe(202);
    const firstPayload = (await first.json()) as IngestResponseBody;
    expect(firstPayload.tenantId).toBe(config.tenantId);
    expect(typeof firstPayload.jobId).toBe("string");

    const second = await fetch(`${config.baseUrl}/ingest`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    expect(second.status).toBe(202);
    const secondPayload = (await second.json()) as IngestResponseBody;
    expect(secondPayload.jobId).toBe(firstPayload.jobId);
  });
});
