#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[preflight] Typecheck"
pnpm exec tsc --noEmit

echo "[preflight] Governance checks"
bash scripts/check-governance.sh

echo "[preflight] OK"
