"use client";

import { useEffect, useState } from "react";
import { createClientRequestId, submitQuery } from "../lib/api-client";
import { DEFAULT_TENANT, DEFAULT_TOP_K } from "../lib/constants";
import { mergeTraceEvents, parseTraceMessage } from "../lib/trace-events";

export function usePortalSession() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [topK, setTopK] = useState(DEFAULT_TOP_K);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [traceRequestId, setTraceRequestId] = useState("");
  const [traceEvents, setTraceEvents] = useState([]);
  const [traceError, setTraceError] = useState("");
  const [isTraceRunning, setIsTraceRunning] = useState(false);

  useEffect(() => {
    if (!traceRequestId || !isTraceRunning) return undefined;

    const streamUrl = `/api/trace/stream?requestId=${encodeURIComponent(traceRequestId)}`;
    const source = new EventSource(streamUrl);

    source.onmessage = (message) => {
      try {
        const parsed = parseTraceMessage(message.data);
        setTraceEvents((previous) => mergeTraceEvents(previous, parsed.events));

        if (parsed.finished) {
          setIsTraceRunning(false);
          source.close();
        }
      } catch {
        setTraceError("Trace stream payload parse failed");
        setIsTraceRunning(false);
        source.close();
      }
    };

    source.onerror = () => {
      setTraceError("Trace stream disconnected");
      setIsTraceRunning(false);
      source.close();
    };

    return () => {
      source.close();
    };
  }, [traceRequestId, isTraceRunning]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setTraceError("");
    setTraceEvents([]);

    try {
      const clientRequestId = createClientRequestId();
      setTraceRequestId(clientRequestId);
      setIsTraceRunning(true);

      const payload = {
        tenantId,
        question,
        topK,
      };

      const data = await submitQuery(payload, clientRequestId);
      setResult(data);
      if (!data?.requestId) {
        setIsTraceRunning(false);
      }
    } catch (requestError) {
      setResult(null);
      setError(requestError.message || "Query failed");
      setIsTraceRunning(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
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
  };
}
