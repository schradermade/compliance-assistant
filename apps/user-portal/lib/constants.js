export const DEFAULT_TENANT = "tenant_abc";
export const DEFAULT_TOP_K = 5;

export const TRACE_STAGES = [
  {
    key: "request_received",
    label: "Request Received",
    architecture: "API Worker - Ingress",
  },
  {
    key: "json_parsed",
    label: "JSON Parsed",
    architecture: "API Worker - Parser",
  },
  {
    key: "validated",
    label: "Validated",
    architecture: "API Worker - Schema Validation",
  },
  {
    key: "retrieval_started",
    label: "Retrieval Started",
    architecture: "Retrieval Layer - Vectorize + Metadata",
  },
  {
    key: "retrieval_done",
    label: "Retrieval Done",
    architecture: "Retrieval Layer - Context Assembled",
  },
  {
    key: "model_call_started",
    label: "Model Call Started",
    architecture: "Model Provider - Invocation",
  },
  {
    key: "model_call_done",
    label: "Model Call Done",
    architecture: "Model Provider - Response Received",
  },
  {
    key: "response_sent",
    label: "Response Sent",
    architecture: "API Worker - Egress to User Portal",
  },
];
