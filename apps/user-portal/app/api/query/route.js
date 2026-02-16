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
    const upstream = await fetch(new URL("/query", apiBase), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
