# Release Readiness Checklist

Date: 2026-03-05

## Security
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` in production.
- [ ] Configure strict `CORS_ORIGINS` to production web domains only.
- [ ] Run API behind TLS; ensure secure cookies in production.
- [ ] Rotate default seeded credentials before first production deployment.
- [ ] Enforce strong password policy for user creation/admin operations.
- [ ] Ensure DB backups and at-rest encryption are enabled.
- [ ] Configure object storage credentials via secret manager (not plain env files in CI logs).
- [ ] Validate that error responses do not leak stack traces/secrets.

## Operational Runbook
- [ ] Define on-call ownership for API, DB, object storage, and web frontend.
- [ ] Add service health probes and dashboards (API health endpoint, DB connectivity, error rate, latency).
- [ ] Define alert thresholds (5xx rate, auth failures spike, refresh failure rate, storage errors).
- [ ] Document incident response steps for auth outage, DB outage, and data-corruption recovery.
- [ ] Define log retention, PII handling, and access controls.

## Data + Migration Safety
- [ ] Use Prisma migrations with reviewed SQL; no schema drift in production.
- [ ] Validate migration rollback or restore procedure in staging.
- [ ] Confirm seed scripts are disabled or gated for production.

## Deployment Notes
- [ ] Build immutable images for `apps/api` and `apps/web`.
- [ ] Inject runtime configuration (`VITE_API_BASE_URL`, API env vars) per environment.
- [ ] Run API as non-root user where possible.
- [ ] Set container resource requests/limits.
- [ ] Configure rolling deployment with readiness checks.
- [ ] Verify blue/green or canary rollback strategy.

## Pre-Release Go/No-Go
- [ ] Full regression checklist completed and signed off.
- [ ] RBAC matrix reviewed and approved by product/security owner.
- [ ] Load/perf sanity test executed on realistic seed volume.
- [ ] Disaster recovery drill performed (restore latest backup into staging).
- [ ] Production deployment runbook reviewed by team.
