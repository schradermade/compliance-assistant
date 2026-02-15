export function Topbar({
  selectedTenant,
  selectedRange,
  tenantOptions,
  rangeOptions,
  dataMode,
}) {
  return (
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
              <option key={tenant.value || "platform"} value={tenant.value}>
                {tenant.label}
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
        <span className="tag">{dataMode}</span>
      </form>
    </header>
  );
}
