import {
  metricsGranularitySchema,
  type MetricsQueryParams,
} from "../zod/metrics.schema";

export function parseMetricsQueryParams(url: URL): MetricsQueryParams {
  const granularity = url.searchParams.get("granularity");
  const parsedGranularity = metricsGranularitySchema.safeParse(granularity);

  return {
    tenantId: url.searchParams.get("tenantId") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    granularity: parsedGranularity.success ? parsedGranularity.data : undefined,
  };
}
