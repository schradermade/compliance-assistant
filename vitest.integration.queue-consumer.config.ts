import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    include: ["apps/queue-consumer/src/**/*.integration.test.ts"],
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./apps/queue-consumer/wrangler.toml",
        },
      },
    },
  },
});
