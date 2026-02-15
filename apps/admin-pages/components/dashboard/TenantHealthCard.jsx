export function TenantHealthCard({ tenantScopeLabel, tenantRows }) {
  return (
    <article className="card">
      <div className="card-head">
        <h3>Tenant Health</h3>
        <span className="tag subtle">{tenantScopeLabel}</span>
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
            {tenantRows.map((tenant) => (
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
  );
}
