export class RateLimiter {
  constructor(
    private readonly _state: unknown,
    private readonly _env: unknown,
  ) {}

  async fetch(): Promise<Response> {
    return Response.json({ status: "ok", service: "rate-limiter" });
  }
}
