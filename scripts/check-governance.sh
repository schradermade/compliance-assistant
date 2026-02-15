#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_files=(
  "docs/engineering-playbook.md"
  "docs/adrs/ADR-0001-schema-first-validation.md"
  "docs/checklists/pr-checklist.md"
  "docs/architecture.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "[governance] Missing required file: $file"
    exit 1
  fi
done

# Enforce schema-first contracts: legacy duplicated contract files must not reappear.
for forbidden in \
  "packages/shared/src/schemas/query.ts" \
  "packages/shared/src/schemas/ingest.ts" \
  "packages/shared/src/schemas/metrics.ts"
do
  if [[ -f "$forbidden" ]]; then
    echo "[governance] Forbidden duplicated contract file detected: $forbidden"
    echo "[governance] Use zod schemas in packages/shared/src/schemas/zod instead."
    exit 1
  fi
done

# Ensure zod schemas exist for core contracts.
core_schemas=(
  "packages/shared/src/schemas/zod/query.schema.ts"
  "packages/shared/src/schemas/zod/ingest.schema.ts"
  "packages/shared/src/schemas/zod/metrics.schema.ts"
)

for schema in "${core_schemas[@]}"; do
  if [[ ! -f "$schema" ]]; then
    echo "[governance] Missing required zod schema: $schema"
    exit 1
  fi
done

echo "[governance] OK"
