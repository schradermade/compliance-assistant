import { z } from "zod";
import type { RequestMeta } from "../common";

export const metricsGranularitySchema = z.union([
  z.literal("5m"),
  z.literal("1h"),
  z.literal("1d"),
]);

export const metricsQueryParamsSchema = z.object({
  tenantId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  granularity: metricsGranularitySchema.optional(),
});

export type MetricsQueryParams = z.infer<typeof metricsQueryParamsSchema>;

export interface MetricsResponse extends RequestMeta {
  scope: {
    tenantId?: string;
    from?: string;
    to?: string;
    granularity: "5m" | "1h" | "1d";
  };
  metrics: {
    requests: number;
    successRate: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
    cacheHitRate: number;
    throttleEvents: number;
  };
}
