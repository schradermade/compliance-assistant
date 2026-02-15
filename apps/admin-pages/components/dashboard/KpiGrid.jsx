import { toneClass } from "../../lib/dashboard/format";

export function KpiGrid({ kpis }) {
  return (
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
  );
}
