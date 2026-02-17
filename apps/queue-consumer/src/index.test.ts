import assert from "node:assert/strict";
import worker from "./index";

function validMessageBody() {
  return {
    jobId: "job_test_1",
    requestId: "req_test_1",
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

async function testInvalidMessageGetsAcked() {
  let acked = false;
  await worker.queue(
    {
      messages: [
        {
          id: "m_invalid",
          body: { nope: true },
          ack: () => {
            acked = true;
          },
        },
      ],
    },
    {},
  );
  assert.equal(acked, true);
}

async function testValidMessageGetsAckedOnSuccess() {
  let acked = false;
  await worker.queue(
    {
      messages: [
        {
          id: "m_valid",
          body: validMessageBody(),
          ack: () => {
            acked = true;
          },
        },
      ],
    },
    {},
  );
  assert.equal(acked, true);
}

async function testTenantScopeMismatchDoesNotAck() {
  let acked = false;
  await worker.queue(
    {
      messages: [
        {
          id: "m_scope_mismatch",
          body: {
            ...validMessageBody(),
            tenantId: "tenant_abc",
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
  assert.equal(acked, false);
}

async function run() {
  await testInvalidMessageGetsAcked();
  await testValidMessageGetsAckedOnSuccess();
  await testTenantScopeMismatchDoesNotAck();
  console.log("queue-consumer/index.test.ts: ok");
}

run();
