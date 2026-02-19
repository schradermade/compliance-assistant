import { describe, expect, it } from "vitest";
import { enforceAccessJwt } from "./access-jwt";

describe("enforceAccessJwt", () => {
  it("bypasses verification in non-required mode when token is missing", async () => {
    const request = new Request("https://example.test/query");
    const result = await enforceAccessJwt(request, "req_test_1", {
      ENV_NAME: "dev",
    });
    expect(result).toBeUndefined();
  });

  it("returns 401 when verification is required and token is missing", async () => {
    const request = new Request("https://example.test/query");
    const result = await enforceAccessJwt(request, "req_test_2", {
      ENV_NAME: "prod",
    });
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(401);
  });

  it("returns 500 when required mode is enabled and verifier config is missing", async () => {
    const request = new Request("https://example.test/query", {
      headers: {
        "cf-access-jwt-assertion": "token",
      },
    });
    const result = await enforceAccessJwt(request, "req_test_3", {
      REQUIRE_ACCESS_JWT: "1",
    });
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(500);
  });

  it("bypasses token verification when optional mode lacks verifier config", async () => {
    const request = new Request("https://example.test/query", {
      headers: {
        "cf-access-jwt-assertion": "token",
      },
    });
    const result = await enforceAccessJwt(request, "req_test_4", {
      ENV_NAME: "staging",
    });
    expect(result).toBeUndefined();
  });
});
