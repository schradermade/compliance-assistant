import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    include: ["apps/api-worker/src/**/*.integration.test.ts"],
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./apps/api-worker/wrangler.toml",
        },
      },
    },
  },
});
