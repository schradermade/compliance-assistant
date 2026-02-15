import { queryRequestSchema } from "../zod/query.schema";
import type { QueryRequest } from "../zod/query.schema";

export function isQueryRequest(value: unknown): value is QueryRequest {
  return queryRequestSchema.safeParse(value).success;
}
