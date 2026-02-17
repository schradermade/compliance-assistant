import { resolveApiAuthHeaders } from "../../../../shared/api-auth-headers";

export async function POST(request) {
  const apiBase = process.env.API_WORKER_URL || "http://127.0.0.1:8787";
  const clientRequestId = request.headers.get("x-request-id") ?? "";

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "invalid_json", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  try {
    const auth = resolveApiAuthHeaders({
      sourceHeaders: request.headers,
      defaultEmail: "dev-user@local",
      defaultRoles: "tenant_viewer",
    });
    if (!auth.ok) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "user_portal_auth_config_error",
          route: "POST /api/query",
          message: auth.error,
        }),
      );
      return Response.json(
        { error: { code: "auth_config_error", message: auth.error } },
        { status: 500 },
      );
    }

    const upstream = await fetch(new URL("/query", apiBase), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth.headers,
        ...(clientRequestId ? { "x-request-id": clientRequestId } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    return Response.json(data, { status: upstream.status });
  } catch {
    return Response.json(
      { error: { code: "upstream_unavailable", message: "API Worker is unreachable" } },
      { status: 502 },
    );
  }
}
