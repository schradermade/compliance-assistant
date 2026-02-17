import { resolveApiAuthHeaders } from "../../../../shared/api-auth-headers";

export async function GET(request) {
  const apiBase = process.env.API_WORKER_URL || "http://127.0.0.1:8787";
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId") ?? "";

  if (!requestId) {
    return Response.json(
      { error: { code: "invalid_request", message: "requestId is required" } },
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
          route: "GET /api/trace/stream",
          message: auth.error,
        }),
      );
      return Response.json(
        { error: { code: "auth_config_error", message: auth.error } },
        { status: 500 },
      );
    }

    const upstream = await fetch(
      new URL(`/trace/stream?requestId=${encodeURIComponent(requestId)}`, apiBase),
      {
        method: "GET",
        headers: auth.headers,
        cache: "no-store",
      },
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return Response.json(
      { error: { code: "upstream_unavailable", message: "API Worker is unreachable" } },
      { status: 502 },
    );
  }
}
