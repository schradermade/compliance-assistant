const kpis = [
  { label: "Requests (24h)", value: "3,281", delta: "+8.4%", tone: "good" },
  { label: "p95 Latency", value: "3.72s", delta: "-0.43s", tone: "good" },
  { label: "Error Rate", value: "0.70%", delta: "-0.20%", tone: "good" },
  { label: "Cost / 24h", value: "$64.23", delta: "+$4.11", tone: "warn" },
];

const tenants = [
  { name: "tenant_abc", requests: 1290, latency: "3.2s", errors: "0.4%" },
  { name: "tenant_delta", requests: 844, latency: "4.1s", errors: "0.9%" },
  { name: "tenant_omega", requests: 612, latency: "3.8s", errors: "0.6%" },
  { name: "tenant_prime", requests: 535, latency: "4.4s", errors: "1.1%" },
];

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

export default function DashboardPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Compliance Assistant</p>
          <h1>Service Operations</h1>
        </div>
        <div className="topbar-meta">
          <span className="tag">Staging</span>
          <span className="tag">WNAM</span>
          <span className="tag">Updated 14s ago</span>
        </div>
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
            <span className="tag subtle">4 tenants</span>
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
