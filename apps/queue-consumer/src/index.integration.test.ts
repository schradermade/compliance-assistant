import { describe, expect, it } from "vitest";
import worker from "./index";

function validMessageBody() {
  return {
    jobId: "job_integration_1",
    requestId: "req_integration_1",
    tenantId: "tenant_abc",
    requestedBy: {
      userId: "user_1",
      email: "user_1@example.com",
      roles: ["tenant_admin"],
    },
    document: {
      sourceType: "r2",
      objectKey: "tenant_abc/policies/policy.pdf",
      title: "Policy",
    },
    requestedAt: new Date().toISOString(),
  };
}

describe("queue-consumer integration", () => {
  it("acks invalid messages", async () => {
    let acked = false;
    await worker.queue(
      {
        messages: [
          {
            id: "m_invalid_integration",
            body: { nope: true },
            ack: () => {
              acked = true;
            },
          },
        ],
      },
      {},
    );
    expect(acked).toBe(true);
  });

  it("acks valid messages after successful pipeline", async () => {
    let acked = false;
    await worker.queue(
      {
        messages: [
          {
            id: "m_valid_integration",
            body: validMessageBody(),
            ack: () => {
              acked = true;
            },
          },
        ],
      },
      {},
    );
    expect(acked).toBe(true);
  });

  it("does not ack tenant scope mismatch failures", async () => {
    let acked = false;
    await worker.queue(
      {
        messages: [
          {
            id: "m_scope_mismatch_integration",
            body: {
              ...validMessageBody(),
              document: {
                sourceType: "r2",
                objectKey: "tenant_other/policies/policy.pdf",
                title: "Policy",
              },
            },
            ack: () => {
              acked = true;
            },
          },
        ],
      },
      {},
    );
    expect(acked).toBe(false);
  });
});
