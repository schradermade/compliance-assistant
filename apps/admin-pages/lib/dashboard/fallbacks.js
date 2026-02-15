export const FALLBACK_METRICS = {
  requests: 0,
  successRate: 1,
  p50LatencyMs: 0,
  p95LatencyMs: 0,
  promptTokens: 0,
  completionTokens: 0,
  estimatedCostUsd: 0,
  cacheHitRate: 0,
  throttleEvents: 0,
};

export const FALLBACK_JOBS = [
  {
    id: "job_8f2ca12",
    tenantId: "tenant_abc",
    stage: "index",
    status: "processing",
    attempts: 1,
  },
];

export function createFallbackIncidents() {
  return [
    {
      id: "req_fallback_01",
      route: "GET /metrics",
      code: "upstream_unavailable",
      summary: "Using fallback incident data",
      at: new Date().toISOString(),
      severity: "low",
    },
  ];
}
