import { Hono } from "hono";
export { RateLimiter } from "./durable/rate-limiter";
import { handleHealth } from "./routes/health";
import { handleIngest } from "./routes/ingest";
import { handleIncidents } from "./routes/incidents";
import { handleJobs } from "./routes/jobs";
import { handleMetrics } from "./routes/metrics";
import { handleQuery } from "./routes/query";

export interface Env {}

const app = new Hono<{ Bindings: Env }>();

app.get("/health", () => handleHealth());
app.post("/query", (c) => handleQuery(c.req.raw, c.env));
app.post("/ingest", (c) => handleIngest(c.req.raw, c.env));
app.get("/metrics", (c) => handleMetrics(c.req.raw, c.env));
app.get("/jobs", (c) => handleJobs(c.req.raw, c.env));
app.get("/incidents", (c) => handleIncidents(c.req.raw, c.env));

app.notFound((c) =>
  c.json({ error: { code: "not_found", message: "Route not found" } }, 404),
);

export default app;
