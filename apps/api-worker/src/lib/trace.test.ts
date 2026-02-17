import assert from "node:assert/strict";
import type { TraceEvent } from "./trace";
import { resolveTraceTenantId } from "./trace";

function makeEvent(payload: Record<string, unknown>): TraceEvent {
  return {
    requestId: "req_test",
    stage: "validated",
    status: "ok",
    ts: new Date().toISOString(),
    payload,
  };
}

function testResolveTenantFromNestedRequest() {
  const events = [
    makeEvent({
      outgoing: {
        request: {
          tenantId: "tenant_abc",
        },
      },
    }),
  ];

  assert.equal(resolveTraceTenantId(events), "tenant_abc");
}

function testResolveTenantFromRawBody() {
  const events = [
    makeEvent({
      incoming: {
        body: JSON.stringify({ tenantId: "tenant_delta" }),
      },
    }),
  ];

  assert.equal(resolveTraceTenantId(events), "tenant_delta");
}

function testResolveTenantMissing() {
  const events = [makeEvent({ incoming: { body: "{}" } })];
  assert.equal(resolveTraceTenantId(events), undefined);
}

function run() {
  testResolveTenantFromNestedRequest();
  testResolveTenantFromRawBody();
  testResolveTenantMissing();
  console.log("trace.test.ts: ok");
}

run();
