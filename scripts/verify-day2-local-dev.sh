#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_cmds=(node pnpm rg)
for cmd in "${required_cmds[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[day2] Missing required command: $cmd"
    exit 1
  fi
done

run_check() {
  local name="$1"
  local config="$2"
  local extra="${3:-}"
  echo "[day2] Starting ${name}"
  # shellcheck disable=SC2086
  pnpm dlx wrangler dev --config "$config" --env dev $extra >/tmp/"$name".log 2>&1 &
  local pid=$!
  sleep 12
  kill "$pid" >/dev/null 2>&1 || true
  wait "$pid" 2>/dev/null || true

  if rg -q "Ready on|Listening|Starting local server" /tmp/"$name".log; then
    echo "[day2] ${name}: started successfully"
  else
    echo "[day2] ${name}: failed to start"
    cat /tmp/"$name".log
    exit 1
  fi
}

run_check "api-worker" "apps/api-worker/wrangler.toml" "--port 8787"
run_check "ingest-worker" "apps/ingest-worker/wrangler.toml" "--port 8788"
run_check "queue-consumer" "apps/queue-consumer/wrangler.toml" "--port 8789"

echo "[day2] All worker local dev checks passed"
