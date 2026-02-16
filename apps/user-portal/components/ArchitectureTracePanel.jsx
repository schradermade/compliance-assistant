import { TRACE_STAGES } from "../lib/constants";

function stageClass(stageKey, eventsByStage) {
  const event = eventsByStage.get(stageKey);
  if (!event) return "idle";
  if (event.status === "error") return "error";
  if (event.status === "active") return "active";
  return "done";
}

function timestampFor(eventsByStage, stageKey) {
  const event = eventsByStage.get(stageKey);
  if (!event) return null;
  const ts = Date.parse(event.ts);
  return Number.isNaN(ts) ? null : ts;
}

function renderPayload(payload) {
  if (!payload || typeof payload !== "object") return "no payload";
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return "payload_unserializable";
  }
}

function payloadIncoming(payload) {
  if (!payload || typeof payload !== "object") return null;
  if ("incoming" in payload) return payload.incoming;
  return payload;
}

function payloadOutgoing(payload) {
  if (!payload || typeof payload !== "object") return null;
  if ("outgoing" in payload) return payload.outgoing;
  return null;
}

function computeStageDurationMs(stageKey, eventsByStage, isRunning) {
  const durationPairs = {
    json_parsed: ["json_parse_started", "json_parsed"],
    validated: ["validation_started", "validated"],
    retrieval_started: ["retrieval_started", "retrieval_done"],
    retrieval_done: ["retrieval_started", "retrieval_done"],
    model_call_started: ["model_call_started", "model_call_done"],
    model_call_done: ["model_call_started", "model_call_done"],
    response_sent: ["request_received", "response_sent"],
  };

  const pair = durationPairs[stageKey];
  if (!pair) return null;

  const startTs = timestampFor(eventsByStage, pair[0]);
  const endTs = timestampFor(eventsByStage, pair[1]);
  if (startTs === null) return null;

  if (endTs !== null) {
    return Math.max(0, endTs - startTs);
  }

  if (isRunning && (stageKey.endsWith("_started") || stageKey === "response_sent")) {
    return Math.max(0, Date.now() - startTs);
  }

  return null;
}

export function ArchitectureTracePanel({ requestId, events, isRunning, traceError }) {
  const eventsByStage = new Map(events.map((event) => [event.stage, event]));
  const stagesWithState = TRACE_STAGES.map((stage) => ({
    ...stage,
    state: stageClass(stage.key, eventsByStage),
    event: eventsByStage.get(stage.key),
    durationMs: computeStageDurationMs(stage.key, eventsByStage, isRunning),
  }));

  return (
    <section className="panel trace-panel">
      <div className="panel-head trace-head">
        <h2>Live Architecture Trace</h2>
        <div className="trace-meta">
          <span className="chip mono">{requestId || "no request"}</span>
          <span className="chip">{isRunning ? "Streaming" : "Idle"}</span>
        </div>
      </div>

      {traceError ? <div className="error-box">{traceError}</div> : null}

      <div className="trace-layout">
        <div className="trace-graph">
          {stagesWithState.map((stage, index) => {
            const hasConnector = index < stagesWithState.length - 1;
            return (
              <div className="trace-column" key={stage.key}>
                <div className={`trace-node ${stage.state}`}>
                  <span className="trace-index">{index + 1}</span>
                  <p className="trace-node-title">{stage.label}</p>
                  <p className="trace-node-architecture">{stage.architecture}</p>
                  <div className="trace-payload-section">
                    <details className="trace-payload-details" open>
                      <summary className="trace-payload-title">
                        Incoming Request
                      </summary>
                      <pre className="trace-node-payload mono">
                        {renderPayload(payloadIncoming(stage.event?.payload))}
                      </pre>
                    </details>
                  </div>
                  <div className="trace-payload-section">
                    <details className="trace-payload-details" open>
                      <summary className="trace-payload-title">
                        Outgoing Response
                      </summary>
                      <pre className="trace-node-payload mono">
                        {renderPayload(payloadOutgoing(stage.event?.payload))}
                      </pre>
                    </details>
                  </div>
                  <span className="trace-node-duration mono">
                    {stage.durationMs === null ? "--" : `${stage.durationMs}ms`}
                  </span>
                </div>
                {hasConnector ? (
                  <div className={`trace-connector ${stage.state}`}>
                    <span className="trace-connector-line" />
                    <span className="trace-connector-arrow">▼</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <aside className="trace-timeline">
          {stagesWithState.map((stage, index) => (
            <div className="trace-timeline-item" key={`${stage.key}-meta`}>
              <span className="subtle mono">#{index + 1}</span>
                <span className={`trace-pill ${stage.state}`}>
                  {stage.event?.status ?? "pending"}
                </span>
                <span className="trace-timeline-label">
                  {stage.label}
                  <span className="trace-timeline-architecture">
                    {stage.architecture}
                  </span>
                  <span className="trace-timeline-duration mono">
                    {stage.durationMs === null ? "--" : `${stage.durationMs}ms`}
                  </span>
                </span>
              </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
