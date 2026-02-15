import { z } from "zod";
import type { RequestMeta } from "../common";

export const queryFiltersSchema = z
  .object({
    tags: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
  })
  .optional();

export const queryRequestSchema = z.object({
  tenantId: z.string().min(1),
  question: z.string().min(1),
  topK: z.number().int().positive().max(20).optional(),
  filters: queryFiltersSchema,
  conversationId: z.string().min(1).optional(),
});

export type QueryRequest = z.infer<typeof queryRequestSchema>;

export interface QueryCitation {
  sourceId: string;
  chunkId: string;
  title: string;
  score: number;
}

export interface QueryResponse extends RequestMeta {
  answer: string;
  citations: QueryCitation[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  latencyMs: number;
}
