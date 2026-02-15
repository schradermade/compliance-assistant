#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[policy] Running policy checks"

# 1) Placeholder IDs in wrangler config should not reach mainline without explicit acknowledgement.
placeholder_files="$(rg -l 'REPLACE_WITH_' apps/**/wrangler.toml 2>/dev/null || true)"
if [[ -n "$placeholder_files" ]]; then
  echo "[policy] Found placeholder Cloudflare IDs in wrangler config:"
  echo "$placeholder_files"
  echo "[policy] Replace REPLACE_WITH_* values before production-ready deployment."
  if [[ "${POLICY_ENFORCE_REAL_CF_IDS:-0}" == "1" ]]; then
    echo "[policy] Failing check because POLICY_ENFORCE_REAL_CF_IDS=1."
    exit 1
  else
    echo "[policy] Warning only. Set POLICY_ENFORCE_REAL_CF_IDS=1 to enforce as hard failure."
  fi
fi

# 2) If architecture-sensitive files changed, require ADR/docs change in same diff range.
base_ref="${POLICY_BASE_REF:-origin/main}"
if git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  changed="$(git diff --name-only "$base_ref"...HEAD)"

  sensitive_changed=0
  docs_or_adr_changed=0

  while IFS= read -r file; do
    [[ -z "$file" ]] && continue

    case "$file" in
      apps/api-worker/*|apps/ingest-worker/*|apps/queue-consumer/*|packages/shared/src/schemas/zod/*)
        sensitive_changed=1
        ;;
    esac

    case "$file" in
      docs/adrs/*|docs/architecture.md|docs/engineering-playbook.md)
        docs_or_adr_changed=1
        ;;
    esac
  done <<< "$changed"

  if [[ "$sensitive_changed" == "1" && "$docs_or_adr_changed" == "0" ]]; then
    echo "[policy] Architecture-sensitive code changed without ADR/architecture doc updates."
    echo "[policy] Add/update docs/adrs/* or docs/architecture.md (or set SKIP_ADR_CHECK=1 for exceptional cases)."
    if [[ "${SKIP_ADR_CHECK:-0}" != "1" ]]; then
      exit 1
    fi
  fi
else
  echo "[policy] Base ref '$base_ref' not found; skipping ADR diff check."
fi

echo "[policy] OK"
