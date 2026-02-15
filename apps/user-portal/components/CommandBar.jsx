export function CommandBar() {
  return (
    <header className="command-bar panel">
      <div>
        <p className="eyebrow">Compliance Assistant</p>
        <h1>User Query Console</h1>
      </div>
      <div className="status-group">
        <span className="chip">Mode: Query</span>
        <span className="chip">Policy Grounded</span>
        <span className="chip">Session: Live</span>
      </div>
    </header>
  );
}
