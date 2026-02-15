import { formatLatency, formatRate, formatUsd } from "./format";

export function buildDashboardViewModel({
  selectedTenant,
  metricsResult,
  jobsResult,
  incidentsResult,
}) {
  const { metrics, scopeTenantId, source: metricsSource } = metricsResult;
  const { jobs, source: jobsSource } = jobsResult;
  const { incidents, source: incidentsSource } = incidentsResult;

  const dataMode =
    metricsSource === "live" && jobsSource === "live" && incidentsSource === "live"
      ? "Live data"
      : "Partial fallback";

  const errorRate = Math.max(0, 1 - metrics.successRate);

  const kpis = [
    {
      label: "Requests (24h)",
      value: metrics.requests.toLocaleString(),
      delta: metricsSource === "live" ? "live" : "fallback",
      tone: metricsSource === "live" ? "good" : "neutral",
    },
    {
      label: "p95 Latency",
      value: formatLatency(metrics.p95LatencyMs),
      delta: `p50 ${formatLatency(metrics.p50LatencyMs)}`,
      tone: metrics.p95LatencyMs <= 5000 ? "good" : "warn",
    },
    {
      label: "Error Rate",
      value: formatRate(errorRate),
      delta: `success ${formatRate(metrics.successRate)}`,
      tone: errorRate <= 0.02 ? "good" : "warn",
    },
    {
      label: "Cost / 24h",
      value: formatUsd(metrics.estimatedCostUsd),
      delta: `${metrics.promptTokens + metrics.completionTokens} tokens`,
      tone: "warn",
    },
  ];

  const tenantRows = [
    {
      name: scopeTenantId ?? "platform",
      requests: metrics.requests,
      latency: formatLatency(metrics.p95LatencyMs),
      errors: formatRate(errorRate),
    },
  ];

  return {
    kpis,
    jobs,
    incidents,
    tenantRows,
    dataMode,
    tenantScopeLabel: selectedTenant ? "1 tenant" : "All tenants",
  };
}
