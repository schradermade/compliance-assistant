export function mergeTraceEvents(previous, incremental) {
  const merged = [...previous];

  for (const event of incremental) {
    const index = merged.findIndex(
      (candidate) =>
        candidate.stage === event.stage && candidate.status === event.status,
    );

    if (index === -1) {
      merged.push(event);
    } else {
      merged[index] = event;
    }
  }

  return merged;
}

export function parseTraceMessage(rawMessage) {
  const payload = JSON.parse(rawMessage);
  const events = Array.isArray(payload.events) ? payload.events : [];
  return {
    events,
    finished: Boolean(payload.finished),
  };
}
