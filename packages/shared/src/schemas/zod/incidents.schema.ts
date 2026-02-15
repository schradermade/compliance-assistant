import { z } from "zod";
import type { RequestMeta } from "../common";

export const incidentSeveritySchema = z.union([
  z.literal("low"),
  z.literal("medium"),
  z.literal("high"),
]);

export const incidentsQueryParamsSchema = z.object({
  tenantId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type IncidentsQueryParams = z.infer<typeof incidentsQueryParamsSchema>;

export interface Incident {
  id: string;
  tenantId: string;
  route: string;
  code: string;
  summary: string;
  at: string;
  severity: "low" | "medium" | "high";
}

export interface IncidentsResponse extends RequestMeta {
  incidents: Incident[];
}
