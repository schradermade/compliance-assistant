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
    const upstream = await fetch(
      new URL(`/trace/stream?requestId=${encodeURIComponent(requestId)}`, apiBase),
      {
        method: "GET",
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
