import { formatRelativeTime } from "../../lib/dashboard/time";

export function IncidentsCard({ incidents }) {
  return (
    <section className="card">
      <div className="card-head">
        <h3>Recent Incidents</h3>
        <span className="tag subtle">{incidents.length} records</span>
      </div>
      <div className="incident-list">
        {incidents.map((incident) => (
          <div key={incident.id} className="incident-item">
            <div>
              <p className="mono">{incident.id}</p>
              <p className="route">{incident.route}</p>
            </div>
            <div>
              <p className={`sev ${incident.severity}`}>{incident.code}</p>
              <p>{incident.summary}</p>
            </div>
            <p className="time">{formatRelativeTime(incident.at)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
