import { handleHealth } from "./routes/health";
import { handleIngest } from "./routes/ingest";
import { handleMetrics } from "./routes/metrics";
import { handleQuery } from "./routes/query";

export interface Env {}
export class RateLimiter {
  constructor(
    private readonly _state: unknown,
    private readonly _env: Env,
  ) {}

  async fetch(): Promise<Response> {
    return Response.json({ status: "ok", service: "rate-limiter" });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "GET" && url.pathname === "/health") {
      return handleHealth();
    }

    if (method === "POST" && url.pathname === "/query") {
      return handleQuery(request, env);
    }

    if (method === "POST" && url.pathname === "/ingest") {
      return handleIngest(request, env);
    }

    if (method === "GET" && url.pathname === "/metrics") {
      return handleMetrics(request, env);
    }

    return Response.json(
      { error: { code: "not_found", message: "Route not found" } },
      { status: 404 },
    );
  },
};
