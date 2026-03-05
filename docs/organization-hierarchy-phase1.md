# Organization Hierarchy - Phase 1

Date: 2026-03-05

## What this phase delivers
- Introduces `Organization` model.
- Associates `Client` and `User` with `organizationId`.
- Keeps existing client-level operational roles unchanged.
- Treats `ADMIN` as organization-level super user.
- Enforces organization boundaries for Clients and Users management APIs.

## Super user behavior
- `ADMIN` can create/manage multiple clients in their organization.
- `ADMIN` can create/manage users across clients in their organization.
- Cross-organization client/user management is blocked.

## Backward-compatible rollout
- Seed script backfills users/clients missing organization into a default organization.
- Existing admin keeps a default `clientId` to avoid breaking client-scoped module pages.
- JWT/session now include `organizationId`.

## Known limitation (next phase)
- Operational modules (SR/Assets/Incidents/Tasks/Surveys) still rely on client scope resolution and are not fully org-aware in API authorization checks yet.
- Next phase should enforce organization ownership when resolving `x-client-id` for admin users across all modules.
