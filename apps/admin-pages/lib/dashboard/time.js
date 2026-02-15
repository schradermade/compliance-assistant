export function rangeToWindow(range) {
  const now = new Date();
  const to = now.toISOString();
  const fromDate = new Date(now);

  if (range === "1h") {
    fromDate.setHours(fromDate.getHours() - 1);
  } else if (range === "7d") {
    fromDate.setDate(fromDate.getDate() - 7);
  } else {
    fromDate.setDate(fromDate.getDate() - 1);
  }

  const granularity = range === "1h" ? "5m" : range === "7d" ? "1d" : "1h";
  return { from: fromDate.toISOString(), to, granularity };
}

export function formatRelativeTime(iso) {
  const deltaMs = Date.now() - Date.parse(iso);
  const minutes = Math.max(0, Math.floor(deltaMs / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
