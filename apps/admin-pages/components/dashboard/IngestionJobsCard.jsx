export function IngestionJobsCard({ jobs }) {
  return (
    <article className="card">
      <div className="card-head">
        <h3>Ingestion Jobs</h3>
        <span className="tag subtle">{jobs.length} records</span>
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
                <td>{job.tenantId}</td>
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
  );
}
