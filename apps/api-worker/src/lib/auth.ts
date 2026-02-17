import type { AuthContext, Role } from "../../../../packages/shared/src";
import { jsonError } from "./http";

const ALL_ROLES: Role[] = [
  "platform_admin",
  "tenant_admin",
  "tenant_analyst",
  "tenant_viewer",
  "service_account",
];

function parseRoles(value: string): Role[] {
  return value
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is Role => ALL_ROLES.includes(role as Role));
}

export function requireAuthContext(
  request: Request,
  requestId: string,
): AuthContext | Response {
  const email =
    request.headers.get("x-auth-user-email") ??
    request.headers.get("cf-access-authenticated-user-email");
  const userId = request.headers.get("x-auth-user-id") ?? email;
  const tenantId = request.headers.get("x-auth-tenant-id");
  const rawRoles = request.headers.get("x-auth-roles");

  if (!email || !userId || !tenantId || !rawRoles) {
    return jsonError(
      requestId,
      "unauthenticated",
      "Missing identity headers",
      401,
      tenantId ?? "unknown",
    );
  }

  const roles = parseRoles(rawRoles);
  if (roles.length === 0) {
    return jsonError(
      requestId,
      "unauthenticated",
      "No valid roles were provided",
      401,
      tenantId,
    );
  }

  return {
    userId,
    email,
    tenantId,
    roles,
  };
}

export function hasAnyRole(
  auth: AuthContext,
  allowedRoles: readonly Role[],
): boolean {
  return auth.roles.some((role) => allowedRoles.includes(role));
}

export function enforceRoles(
  requestId: string,
  auth: AuthContext,
  allowedRoles: readonly Role[],
): Response | undefined {
  if (hasAnyRole(auth, allowedRoles)) {
    return undefined;
  }

  return jsonError(
    requestId,
    "forbidden",
    "Caller role is not allowed for this action",
    403,
    auth.tenantId,
  );
}

export function enforceTenantScope(
  requestId: string,
  auth: AuthContext,
  targetTenantId: string,
): Response | undefined {
  if (auth.roles.includes("platform_admin")) {
    return undefined;
  }

  if (auth.tenantId === targetTenantId) {
    return undefined;
  }

  return jsonError(
    requestId,
    "forbidden",
    "Tenant scope mismatch",
    403,
    targetTenantId,
  );
}
