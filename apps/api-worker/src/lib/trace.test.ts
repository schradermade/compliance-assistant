import { describe, expect, it } from "vitest";
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

describe("resolveTraceTenantId", () => {
  it("finds tenant from nested outgoing request payload", () => {
    const events = [
      makeEvent({
        outgoing: {
          request: {
            tenantId: "tenant_abc",
          },
        },
      }),
    ];

    expect(resolveTraceTenantId(events)).toBe("tenant_abc");
  });

  it("finds tenant from raw incoming body JSON", () => {
    const events = [
      makeEvent({
        incoming: {
          body: JSON.stringify({ tenantId: "tenant_delta" }),
        },
      }),
    ];

    expect(resolveTraceTenantId(events)).toBe("tenant_delta");
  });

  it("returns undefined when tenant cannot be resolved", () => {
    const events = [makeEvent({ incoming: { body: "{}" } })];
    expect(resolveTraceTenantId(events)).toBeUndefined();
  });
});
