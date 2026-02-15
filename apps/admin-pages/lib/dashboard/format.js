export function toneClass(tone) {
  if (tone === "good") return "good";
  if (tone === "warn") return "warn";
  return "neutral";
}

export function formatLatency(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatRate(decimal) {
  return `${(decimal * 100).toFixed(2)}%`;
}

export function formatUsd(value) {
  return `$${value.toFixed(2)}`;
}
