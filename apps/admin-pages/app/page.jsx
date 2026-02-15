const FALLBACK_METRICS = {
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

function rangeToWindow(range) {
  const now = new Date();
  const to = now.toISOString();
  const fromDate = new Date(now);

  if (range === "1h") {
    fromDate.setHours(fromDate.getHours() - 1);
  } else if (range === "7d") {
    fromDate.setDate(fromDate.getDate() - 7);
  } else {
    fromDate.setDate(fromDate.getDate() - 1);
  }

  const granularity = range === "1h" ? "5m" : range === "7d" ? "1d" : "1h";
  return { from: fromDate.toISOString(), to, granularity };
}

async function loadMetrics({ tenantId, range }) {
  const baseUrl = process.env.API_WORKER_URL || "http://127.0.0.1:8787";
  const url = new URL("/metrics", baseUrl);
  const { from, to, granularity } = rangeToWindow(range);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("granularity", granularity);

  if (tenantId) {
    url.searchParams.set("tenantId", tenantId);
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        metrics: FALLBACK_METRICS,
        scopeTenantId: "platform",
        source: "fallback",
      };
    }

    const body = await response.json();
    return {
      metrics: body.metrics ?? FALLBACK_METRICS,
      scopeTenantId: body.scope?.tenantId ?? "platform",
      source: "live",
    };
  } catch {
    return {
      metrics: FALLBACK_METRICS,
      scopeTenantId: "platform",
      source: "fallback",
    };
  }
}

const jobs = [
  { id: "job_8f2ca12", tenant: "tenant_abc", stage: "index", status: "processing", attempts: 1 },
  { id: "job_7d1ee31", tenant: "tenant_delta", stage: "embed", status: "processing", attempts: 2 },
  { id: "job_6af0c98", tenant: "tenant_abc", stage: "complete", status: "completed", attempts: 1 },
  { id: "job_4a2d091", tenant: "tenant_omega", stage: "parse", status: "queued", attempts: 1 },
];

const incidents = [
  { id: "req_017fa8f2c9d", route: "POST /query", code: "invalid_request", summary: "Missing question", at: "2m ago", sev: "low" },
  { id: "req_017fa8f29e1", route: "POST /ingest", code: "forbidden", summary: "Role lacks ingest permission", at: "17m ago", sev: "medium" },
  { id: "req_017fa8dbe42", route: "GET /metrics", code: "timeout", summary: "Aggregation exceeded budget", at: "31m ago", sev: "high" },
];

function toneClass(tone) {
  if (tone === "good") return "good";
  if (tone === "warn") return "warn";
  return "neutral";
}

function formatLatency(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatRate(decimal) {
  return `${(decimal * 100).toFixed(2)}%`;
}

function formatUsd(value) {
  return `$${value.toFixed(2)}`;
}

export default async function DashboardPage({ searchParams }) {
  const tenantParam = searchParams?.tenantId;
  const rangeParam = searchParams?.range;
  const selectedTenant = typeof tenantParam === "string" ? tenantParam : "";
  const selectedRange =
    rangeParam === "1h" || rangeParam === "24h" || rangeParam === "7d"
      ? rangeParam
      : "24h";
  const { metrics, scopeTenantId, source } = await loadMetrics({
    tenantId: selectedTenant,
    range: selectedRange,
  });
  const errorRate = Math.max(0, 1 - metrics.successRate);
  const tenantOptions = ["", "tenant_abc", "tenant_delta", "tenant_omega", "tenant_prime"];
  const rangeOptions = [
    { value: "1h", label: "Last 1 hour" },
    { value: "24h", label: "Last 24 hours" },
    { value: "7d", label: "Last 7 days" },
  ];
  const kpis = [
    { label: "Requests (24h)", value: metrics.requests.toLocaleString(), delta: source === "live" ? "live" : "fallback", tone: source === "live" ? "good" : "neutral" },
    { label: "p95 Latency", value: formatLatency(metrics.p95LatencyMs), delta: `p50 ${formatLatency(metrics.p50LatencyMs)}`, tone: metrics.p95LatencyMs <= 5000 ? "good" : "warn" },
    { label: "Error Rate", value: formatRate(errorRate), delta: `success ${formatRate(metrics.successRate)}`, tone: errorRate <= 0.02 ? "good" : "warn" },
    { label: "Cost / 24h", value: formatUsd(metrics.estimatedCostUsd), delta: `${metrics.promptTokens + metrics.completionTokens} tokens`, tone: "warn" },
  ];

  const tenants = [
    {
      name: scopeTenantId ?? "platform",
      requests: metrics.requests,
      latency: formatLatency(metrics.p95LatencyMs),
      errors: formatRate(errorRate),
    },
  ];

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Compliance Assistant</p>
          <h1>Service Operations</h1>
        </div>
        <form className="topbar-meta" method="GET">
          <label className="filter">
            <span>Tenant</span>
            <select name="tenantId" defaultValue={selectedTenant}>
              {tenantOptions.map((tenant) => (
                <option key={tenant || "platform"} value={tenant}>
                  {tenant || "All tenants"}
                </option>
              ))}
            </select>
          </label>
          <label className="filter">
            <span>Range</span>
            <select name="range" defaultValue={selectedRange}>
              {rangeOptions.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </label>
          <button className="apply-btn" type="submit">
            Apply
          </button>
          <span className="tag">Staging</span>
          <span className="tag">WNAM</span>
          <span className="tag">{source === "live" ? "Live metrics" : "Fallback metrics"}</span>
        </form>
      </header>

      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="card kpi-card">
            <p className="label">{kpi.label}</p>
            <div className="kpi-row">
              <h2>{kpi.value}</h2>
              <span className={`delta ${toneClass(kpi.tone)}`}>{kpi.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="main-grid">
        <article className="card">
          <div className="card-head">
            <h3>Tenant Health</h3>
            <span className="tag subtle">
              {selectedTenant ? "1 tenant" : "All tenants"}
            </span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Requests</th>
                  <th>p95</th>
                  <th>Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.name}>
                    <td className="mono">{tenant.name}</td>
                    <td>{tenant.requests.toLocaleString()}</td>
                    <td>{tenant.latency}</td>
                    <td>{tenant.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <h3>Ingestion Jobs</h3>
            <span className="tag subtle">Queue active</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Tenant</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="mono">{job.id}</td>
                    <td>{job.tenant}</td>
                    <td>{job.stage}</td>
                    <td>
                      <span className={`badge ${job.status}`}>{job.status}</span>
                    </td>
                    <td>{job.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Recent Incidents</h3>
          <span className="tag subtle">Last 60 minutes</span>
        </div>
        <div className="incident-list">
          {incidents.map((incident) => (
            <div key={incident.id} className="incident-item">
              <div>
                <p className="mono">{incident.id}</p>
                <p className="route">{incident.route}</p>
              </div>
              <div>
                <p className={`sev ${incident.sev}`}>{incident.code}</p>
                <p>{incident.summary}</p>
              </div>
              <p className="time">{incident.at}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
