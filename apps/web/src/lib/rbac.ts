import { getCurrentUser } from "./auth";

export const ROLES = {
  ADMIN: "ADMIN",
  SERVICE_MANAGER: "SERVICE_MANAGER",
  SERVICE_DESK_ANALYST: "SERVICE_DESK_ANALYST",
  ENGINEER: "ENGINEER",
  CLIENT_VIEWER: "CLIENT_VIEWER"
} as const;

export function hasAnyRole(roles: string[]) {
  const role = getCurrentUser()?.role;
  if (!role) return false;
  return roles.includes(role);
}
