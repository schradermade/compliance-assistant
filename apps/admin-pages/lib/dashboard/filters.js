const allowedRanges = new Set(["1h", "24h", "7d"]);

function readParam(value) {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}

export function normalizeDashboardFilters(searchParams) {
  const tenantId = readParam(searchParams?.tenantId);
  const rangeInput = readParam(searchParams?.range);
  const range = allowedRanges.has(rangeInput) ? rangeInput : "24h";

  return { tenantId, range };
}
