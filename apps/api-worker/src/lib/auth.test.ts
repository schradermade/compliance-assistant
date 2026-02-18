import { describe, expect, it } from "vitest";
import { enforceRoles, enforceTenantScope, requireAuthContext } from "./auth";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://example.test/query", {
    method: "POST",
    headers,
  });
}

describe("auth", () => {
  it("resolves auth context when required headers are present", () => {
    const request = makeRequest({
      "x-auth-user-id": "user_1",
      "x-auth-user-email": "user@example.com",
      "x-auth-tenant-id": "tenant_abc",
      "x-auth-roles": "tenant_analyst",
    });

    const auth = requireAuthContext(request, "req_test_1");
    expect(auth instanceof Response).toBe(false);
    if (auth instanceof Response) {
      return;
    }

    expect(auth.tenantId).toBe("tenant_abc");
    expect(auth.roles).toEqual(["tenant_analyst"]);
  });

  it("returns 401 when auth headers are missing", () => {
    const request = makeRequest({});
    const auth = requireAuthContext(request, "req_test_2");
    expect(auth instanceof Response).toBe(true);
    if (!(auth instanceof Response)) {
      return;
    }

    expect(auth.status).toBe(401);
  });

  it("returns 403 when caller lacks required role", () => {
    const request = makeRequest({
      "x-auth-user-id": "user_1",
      "x-auth-user-email": "user@example.com",
      "x-auth-tenant-id": "tenant_abc",
      "x-auth-roles": "tenant_viewer",
    });
    const auth = requireAuthContext(request, "req_test_3");
    expect(auth instanceof Response).toBe(false);
    if (auth instanceof Response) {
      return;
    }

    const denied = enforceRoles("req_test_3", auth, ["tenant_admin"]);
    expect(denied instanceof Response).toBe(true);
    expect(denied?.status).toBe(403);
  });

  it("returns 403 when tenant scope does not match", () => {
    const request = makeRequest({
      "x-auth-user-id": "user_1",
      "x-auth-user-email": "user@example.com",
      "x-auth-tenant-id": "tenant_abc",
      "x-auth-roles": "tenant_analyst",
    });
    const auth = requireAuthContext(request, "req_test_4");
    expect(auth instanceof Response).toBe(false);
    if (auth instanceof Response) {
      return;
    }

    const denied = enforceTenantScope("req_test_4", auth, "tenant_delta");
    expect(denied instanceof Response).toBe(true);
    expect(denied?.status).toBe(403);
  });
});
