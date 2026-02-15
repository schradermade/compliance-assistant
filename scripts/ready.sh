#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[ready] Running preflight checks"
pnpm run preflight

echo "[ready] Manual follow-up reminders"
echo "- Confirm branch protection is enabled for main with required CI status checks"
echo "- Confirm Cloudflare wrangler placeholder IDs are replaced for staging/prod"
echo "- Confirm PR checklist is completed before merge"

echo "[ready] OK"
