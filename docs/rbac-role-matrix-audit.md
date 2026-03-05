# RBAC Role Matrix Audit (API vs UI)

Date: 2026-03-05

## Roles
- `ADMIN`
- `SERVICE_MANAGER`
- `SERVICE_DESK_ANALYST`
- `ENGINEER`
- `CLIENT_VIEWER`

## Audit Summary
- API and UI are aligned for route visibility on all currently implemented modules.
- Action-level UI controls are role-filtered for create/update actions in Triage, Incidents, Tasks, and Survey execution.
- Gap closed in this step: missing Users module/screen. Added API `users` endpoints and UI Users page with route/nav protection.

## Matrix
| Module | API Allowed Roles | UI Route Visible Roles | Notes |
|---|---|---|---|
| Dashboard | authenticated users | all authenticated roles | summary widgets only |
| Triage | ADMIN, SERVICE_MANAGER, SERVICE_DESK_ANALYST | ADMIN, SERVICE_MANAGER, SERVICE_DESK_ANALYST | aligned |
| Service Requests | list/get: all internal roles incl CLIENT_VIEWER; write/status: ADMIN, SERVICE_MANAGER, SERVICE_DESK_ANALYST | all authenticated roles | write actions hidden for unauthorized users |
| Incidents | list/get: all internal roles incl CLIENT_VIEWER; create/status: ADMIN, SERVICE_MANAGER, SERVICE_DESK_ANALYST, ENGINEER | all authenticated roles | write actions hidden for unauthorized users |
| Tasks | list/get: all internal roles incl CLIENT_VIEWER; create/status: ADMIN, SERVICE_MANAGER, SERVICE_DESK_ANALYST, ENGINEER | all authenticated roles | write actions hidden for unauthorized users |
| Assets | list: all internal roles incl CLIENT_VIEWER; create: ADMIN, SERVICE_MANAGER, SERVICE_DESK_ANALYST, ENGINEER | all authenticated roles | create hidden for unauthorized users |
| Surveys | list/get: all internal roles incl CLIENT_VIEWER; create/status/item update: ADMIN, SERVICE_MANAGER, SERVICE_DESK_ANALYST, ENGINEER | all authenticated roles | execution actions hidden for unauthorized users |
| Clients | ADMIN | ADMIN | dedicated admin clients page for tenant onboarding and status updates |
| Users | ADMIN, SERVICE_MANAGER | ADMIN, SERVICE_MANAGER | added in this change |

## Tenant Scope Notes
- Non-admin API calls are restricted to token `clientId`.
- Admin calls can scope via `x-client-id` where applicable.
- Users module enforces:
  - service managers cannot cross tenant boundaries,
  - service managers cannot manage admin/service-manager roles,
  - non-admin roles require a `clientId`.
