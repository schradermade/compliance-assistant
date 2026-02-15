function UsageGrid({ usage }) {
  if (!usage) return null;

  return (
    <div className="usage-grid">
      <div className="metric">
        <span>Prompt Tokens</span>
        <strong>{usage.promptTokens}</strong>
      </div>
      <div className="metric">
        <span>Completion Tokens</span>
        <strong>{usage.completionTokens}</strong>
      </div>
      <div className="metric">
        <span>Estimated Cost</span>
        <strong>${usage.estimatedCostUsd?.toFixed?.(4) ?? usage.estimatedCostUsd}</strong>
      </div>
    </div>
  );
}

function CitationList({ citations }) {
  if (!citations || citations.length === 0) {
    return <p className="subtle">No citations returned.</p>;
  }

  return (
    <ul className="citation-list">
      {citations.map((citation, index) => (
        <li key={`${citation.chunkId || index}`}>
          <p>{citation.title || citation.sourceId}</p>
          <span className="subtle">
            source: {citation.sourceId} | chunk: {citation.chunkId} | score: {citation.score}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ResponsePanel({ result, error }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Response</h2>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {!result ? (
        <p className="subtle">Submit a query to view answer, citations, and usage metadata.</p>
      ) : (
        <div className="response-stack">
          <div>
            <p className="subtle mono">requestId: {result.requestId}</p>
            <h3>Answer</h3>
            <p>{result.answer}</p>
          </div>

          <div>
            <h3>Citations</h3>
            <CitationList citations={result.citations} />
          </div>

          <div>
            <h3>Usage</h3>
            <UsageGrid usage={result.usage} />
          </div>
        </div>
      )}
    </section>
  );
}
