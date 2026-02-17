import assert from "node:assert/strict";
import { enforceRoles, enforceTenantScope, requireAuthContext } from "./auth";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://example.test/query", {
    method: "POST",
    headers,
  });
}

function testRequireAuthContextSuccess() {
  const request = makeRequest({
    "x-auth-user-id": "user_1",
    "x-auth-user-email": "user@example.com",
    "x-auth-tenant-id": "tenant_abc",
    "x-auth-roles": "tenant_analyst",
  });

  const auth = requireAuthContext(request, "req_test_1");
  assert.equal(auth instanceof Response, false);
  if (auth instanceof Response) {
    return;
  }

  assert.equal(auth.tenantId, "tenant_abc");
  assert.deepEqual(auth.roles, ["tenant_analyst"]);
}

function testRequireAuthContextMissingHeaders() {
  const request = makeRequest({});
  const auth = requireAuthContext(request, "req_test_2");
  assert.equal(auth instanceof Response, true);
  if (!(auth instanceof Response)) {
    return;
  }

  assert.equal(auth.status, 401);
}

function testEnforceRolesDenied() {
  const request = makeRequest({
    "x-auth-user-id": "user_1",
    "x-auth-user-email": "user@example.com",
    "x-auth-tenant-id": "tenant_abc",
    "x-auth-roles": "tenant_viewer",
  });
  const auth = requireAuthContext(request, "req_test_3");
  assert.equal(auth instanceof Response, false);
  if (auth instanceof Response) {
    return;
  }

  const denied = enforceRoles("req_test_3", auth, ["tenant_admin"]);
  assert.equal(denied instanceof Response, true);
  assert.equal(denied?.status, 403);
}

function testEnforceTenantScopeDenied() {
  const request = makeRequest({
    "x-auth-user-id": "user_1",
    "x-auth-user-email": "user@example.com",
    "x-auth-tenant-id": "tenant_abc",
    "x-auth-roles": "tenant_analyst",
  });
  const auth = requireAuthContext(request, "req_test_4");
  assert.equal(auth instanceof Response, false);
  if (auth instanceof Response) {
    return;
  }

  const denied = enforceTenantScope("req_test_4", auth, "tenant_delta");
  assert.equal(denied instanceof Response, true);
  assert.equal(denied?.status, 403);
}

function run() {
  testRequireAuthContextSuccess();
  testRequireAuthContextMissingHeaders();
  testEnforceRolesDenied();
  testEnforceTenantScopeDenied();
  console.log("auth.test.ts: ok");
}

run();
