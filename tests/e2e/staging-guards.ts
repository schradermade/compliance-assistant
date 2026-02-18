const CONFIRMATION_VALUE = "I_UNDERSTAND_NON_PROD_ONLY";

interface StagingConfig {
  baseUrl: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  roles: string;
}

function normalizeBaseUrl(raw: string): string {
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function assertSafeStagingUrl(baseUrl: string): void {
  const parsed = new URL(baseUrl);
  const host = parsed.hostname.toLowerCase();

  if (!host.includes("staging")) {
    throw new Error(
      `Refusing to run E2E against non-staging host: ${parsed.hostname}`,
    );
  }

  if (host.includes("prod") || host.includes("production")) {
    throw new Error(
      `Refusing to run E2E against production-like host: ${parsed.hostname}`,
    );
  }
}

export function getStagingConfigFromEnv(): StagingConfig {
  const baseUrl = process.env.STAGING_E2E_BASE_URL;
  const confirmation = process.env.STAGING_E2E_CONFIRM;

  if (!baseUrl) {
    throw new Error("Missing STAGING_E2E_BASE_URL");
  }
  if (confirmation !== CONFIRMATION_VALUE) {
    throw new Error(
      `Missing required safety confirmation. Set STAGING_E2E_CONFIRM=${CONFIRMATION_VALUE}`,
    );
  }

  const tenantId = process.env.STAGING_E2E_TENANT_ID ?? "tenant_e2e_staging";
  const userId = process.env.STAGING_E2E_USER_ID ?? "user_e2e_runner";
  const userEmail =
    process.env.STAGING_E2E_USER_EMAIL ?? "e2e-runner@example.com";
  const roles = process.env.STAGING_E2E_ROLES ?? "tenant_admin";

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  assertSafeStagingUrl(normalizedBaseUrl);

  return {
    baseUrl: normalizedBaseUrl,
    tenantId,
    userId,
    userEmail,
    roles,
  };
}

export function buildAuthHeaders(config: StagingConfig): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-auth-user-id": config.userId,
    "x-auth-user-email": config.userEmail,
    "x-auth-tenant-id": config.tenantId,
    "x-auth-roles": config.roles,
  };
}
