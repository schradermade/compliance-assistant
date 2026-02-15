export function QueryComposer({
  tenantId,
  topK,
  question,
  onTenantChange,
  onTopKChange,
  onQuestionChange,
  onSubmit,
  isSubmitting,
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Compose Request</h2>
      </div>

      <form className="query-form" onSubmit={onSubmit}>
        <label>
          Tenant ID
          <input
            value={tenantId}
            onChange={(event) => onTenantChange(event.target.value)}
            placeholder="tenant_abc"
            required
          />
        </label>

        <label>
          Top K
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(event) => onTopKChange(Number(event.target.value || 1))}
            required
          />
        </label>

        <label>
          Question
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="What controls apply to vendor access in our SOC2 policy?"
            rows={8}
            required
          />
        </label>

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting..." : "Run Query"}
        </button>
      </form>
    </section>
  );
}
