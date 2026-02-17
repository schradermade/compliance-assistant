# Incident and Rollback Playbook

Last updated: February 17, 2026

## Severity Model

- `SEV-1`: data isolation breach, auth bypass, or full production outage.
- `SEV-2`: major feature outage with business impact.
- `SEV-3`: degraded behavior with workaround.

## Initial Triage (First 15 Minutes)

1. Capture incident start time, impacted routes, and environment.
2. Identify blast radius by tenant scope and request volume.
3. Assign incident commander and communications owner.
4. Declare severity and start a timeline log.

## Immediate Containment Actions

1. If tenant isolation is at risk:
   - disable affected route by temporary deny response.
   - prioritize data-protection over availability.
2. If only one feature is degraded:
   - isolate failing path and keep unaffected routes live.
3. If deployment regression is suspected:
   - execute rollback to last known good deployment.

## Rollback Procedure

1. Identify previous stable Worker and Pages deployment versions.
2. Re-deploy stable versions for affected services:
   - `api-worker`
   - `ingest-worker`
   - `queue-consumer`
   - `admin-pages`
   - `user-portal`
3. Re-run smoke tests from `docs/runbooks/environment-deploy-runbook.md`.
4. Keep timeline notes with exact timestamps and commands executed.

## Required Evidence and Audit Trail

- Incident ID, request IDs, tenant IDs, and route names involved.
- Decision log for containment and rollback.
- Explicit note if a security-impacting behavior changed.
- Recovery verification results and final closure timestamp.

## Recovery Exit Criteria

- Error rates and latency return to pre-incident baseline.
- No active tenant-isolation, authz, or data-integrity risks.
- Affected customer flows are validated by smoke tests.

## Post-Incident Follow-Up

1. Create a remediation task list with owner + due date.
2. Add missing tests for the failure mode.
3. Update docs/runbook steps that were inaccurate.
4. If architecture-significant mitigation is chosen, add/update ADR in `docs/adrs/`.
