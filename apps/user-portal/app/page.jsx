"use client";

import { ArchitectureTracePanel } from "../components/ArchitectureTracePanel";
import { CommandBar } from "../components/CommandBar";
import { QueryComposer } from "../components/QueryComposer";
import { ResponsePanel } from "../components/ResponsePanel";
import { usePortalSession } from "../hooks/usePortalSession";

export default function UserPortalPage() {
  const {
    tenantId,
    topK,
    question,
    isSubmitting,
    result,
    error,
    traceRequestId,
    traceEvents,
    traceError,
    isTraceRunning,
    setTenantId,
    setTopK,
    setQuestion,
    handleSubmit,
  } = usePortalSession();

  return (
    <main className="portal-shell">
      <CommandBar />

      <section className="portal-grid">
        <QueryComposer
          tenantId={tenantId}
          topK={topK}
          question={question}
          onTenantChange={setTenantId}
          onTopKChange={setTopK}
          onQuestionChange={setQuestion}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <ResponsePanel result={result} error={error} />
      </section>

      <section className="portal-grid single">
        <ArchitectureTracePanel
          requestId={traceRequestId}
          events={traceEvents}
          isRunning={isTraceRunning}
          traceError={traceError}
        />
      </section>
    </main>
  );
}
