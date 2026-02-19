import { createRemoteJWKSet, jwtVerify } from "jose";
import { jsonError } from "./http";

interface AccessJwtEnv {
  REQUIRE_ACCESS_JWT?: string;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_ISSUER?: string;
  CF_ACCESS_JWKS_URL?: string;
  ENV_NAME?: string;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function normalizeIssuer(issuer: string): string {
  return issuer.endsWith("/") ? issuer.slice(0, -1) : issuer;
}

function defaultJwksUrl(issuer: string): string {
  return `${normalizeIssuer(issuer)}/cdn-cgi/access/certs`;
}

function shouldRequireAccessJwt(env: AccessJwtEnv): boolean {
  if (env.REQUIRE_ACCESS_JWT === "1") {
    return true;
  }
  return env.ENV_NAME === "prod";
}

function getJwks(url: string) {
  const existing = jwksCache.get(url);
  if (existing) {
    return existing;
  }

  const jwks = createRemoteJWKSet(new URL(url));
  jwksCache.set(url, jwks);
  return jwks;
}

export async function enforceAccessJwt(
  request: Request,
  requestId: string,
  env: AccessJwtEnv,
  expectedEmail?: string,
): Promise<Response | undefined> {
  const required = shouldRequireAccessJwt(env);
  const accessJwt = request.headers.get("cf-access-jwt-assertion");

  if (!accessJwt) {
    if (!required) {
      return undefined;
    }
    return jsonError(
      requestId,
      "unauthenticated",
      "Missing Cloudflare Access token",
      401,
    );
  }

  const audience = env.CF_ACCESS_AUD;
  const issuer = env.CF_ACCESS_ISSUER;
  const jwksUrl =
    env.CF_ACCESS_JWKS_URL ?? (issuer ? defaultJwksUrl(issuer) : undefined);

  if (!audience || !issuer || !jwksUrl) {
    if (!required) {
      return undefined;
    }
    return jsonError(
      requestId,
      "auth_config_error",
      "Cloudflare Access token verification is not configured",
      500,
    );
  }

  try {
    const { payload } = await jwtVerify(accessJwt, getJwks(jwksUrl), {
      issuer: normalizeIssuer(issuer),
      audience,
    });

    const tokenEmail =
      typeof payload.email === "string" ? payload.email : undefined;
    if (expectedEmail && tokenEmail && tokenEmail !== expectedEmail) {
      return jsonError(
        requestId,
        "unauthenticated",
        "Access token email does not match caller identity",
        401,
      );
    }
  } catch {
    return jsonError(
      requestId,
      "unauthenticated",
      "Invalid Cloudflare Access token",
      401,
    );
  }

  return undefined;
}
