function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function isDevRuntime() {
  const envName = readEnv("ENV_NAME").toLowerCase();
  if (envName === "dev") {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

export function resolveApiAuthHeaders({
  sourceHeaders,
  defaultEmail,
  defaultRoles,
  defaultTenantId = "tenant_abc",
}) {
  const devRuntime = isDevRuntime();
  const cfEmail = sourceHeaders?.get("cf-access-authenticated-user-email") || "";
  const envEmail = readEnv("API_AUTH_USER_EMAIL");
  const email = cfEmail || envEmail || (devRuntime ? defaultEmail : "");
  const userId = readEnv("API_AUTH_USER_ID") || email;
  const tenantId = readEnv("API_AUTH_TENANT_ID") || (devRuntime ? defaultTenantId : "");
  const roles = readEnv("API_AUTH_ROLES") || (devRuntime ? defaultRoles : "");

  if (!email || !userId || !tenantId || !roles) {
    return {
      ok: false,
      error:
        "Missing API auth configuration. Set API_AUTH_USER_EMAIL/API_AUTH_TENANT_ID/API_AUTH_ROLES.",
    };
  }

  return {
    ok: true,
    headers: {
      "x-auth-user-id": userId,
      "x-auth-user-email": email,
      "x-auth-tenant-id": tenantId,
      "x-auth-roles": roles,
    },
  };
}
