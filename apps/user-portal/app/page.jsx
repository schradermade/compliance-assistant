"use client";

import { useState } from "react";
import { CommandBar } from "../components/CommandBar";
import { QueryComposer } from "../components/QueryComposer";
import { ResponsePanel } from "../components/ResponsePanel";
import { submitQuery } from "../lib/api-client";
import { DEFAULT_TENANT, DEFAULT_TOP_K } from "../lib/constants";

export default function UserPortalPage() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [topK, setTopK] = useState(DEFAULT_TOP_K);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        tenantId,
        question,
        topK,
      };

      const data = await submitQuery(payload);
      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(requestError.message || "Query failed");
    } finally {
      setIsSubmitting(false);
    }
  }

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
    </main>
  );
}
