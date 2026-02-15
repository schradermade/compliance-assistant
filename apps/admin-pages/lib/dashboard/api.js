import {
  FALLBACK_JOBS,
  FALLBACK_METRICS,
  createFallbackIncidents,
} from "./fallbacks";
import { rangeToWindow } from "./time";

function buildApiUrl(path, params = {}) {
  const baseUrl = process.env.API_WORKER_URL || "http://127.0.0.1:8787";
  const url = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function fetchJson(path, params) {
  const response = await fetch(buildApiUrl(path, params), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, data: null };
  }

  const data = await response.json();
  return { ok: true, data };
}

export async function loadMetrics({ tenantId, from, to, granularity }) {
  try {
    const result = await fetchJson("/metrics", { tenantId, from, to, granularity });

    if (!result.ok) {
      return {
        metrics: FALLBACK_METRICS,
        scopeTenantId: "platform",
        source: "fallback",
      };
    }

    return {
      metrics: result.data.metrics ?? FALLBACK_METRICS,
      scopeTenantId: result.data.scope?.tenantId ?? "platform",
      source: "live",
    };
  } catch {
    return {
      metrics: FALLBACK_METRICS,
      scopeTenantId: "platform",
      source: "fallback",
    };
  }
}

export async function loadJobs({ tenantId, limit = 20 }) {
  try {
    const result = await fetchJson("/jobs", { tenantId, limit });

    if (!result.ok) {
      return { jobs: FALLBACK_JOBS, source: "fallback" };
    }

    return {
      jobs: Array.isArray(result.data.jobs) ? result.data.jobs : FALLBACK_JOBS,
      source: "live",
    };
  } catch {
    return { jobs: FALLBACK_JOBS, source: "fallback" };
  }
}

export async function loadIncidents({ tenantId, from, to, limit = 20 }) {
  try {
    const result = await fetchJson("/incidents", { tenantId, from, to, limit });

    if (!result.ok) {
      return { incidents: createFallbackIncidents(), source: "fallback" };
    }

    return {
      incidents: Array.isArray(result.data.incidents)
        ? result.data.incidents
        : createFallbackIncidents(),
      source: "live",
    };
  } catch {
    return { incidents: createFallbackIncidents(), source: "fallback" };
  }
}

export async function loadDashboardData({ tenantId, range }) {
  const window = rangeToWindow(range);

  const [metricsResult, jobsResult, incidentsResult] = await Promise.all([
    loadMetrics({ tenantId, ...window }),
    loadJobs({ tenantId }),
    loadIncidents({ tenantId, from: window.from, to: window.to }),
  ]);

  return {
    window,
    metricsResult,
    jobsResult,
    incidentsResult,
  };
}
