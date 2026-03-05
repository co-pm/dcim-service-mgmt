import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Role } from "@prisma/client";

export type JwtUser = {
  userId: string;
  email: string;
  role: Role;
  organizationId?: string | null;
  clientId?: string | null;
};

export function getJwtUser(req: { user?: unknown }): JwtUser {
  const user = req.user as JwtUser | undefined;
  if (!user?.userId || !user.role) {
    throw new ForbiddenException("Missing authenticated user context");
  }
  return user;
}

export function resolveClientScope(user: JwtUser, requestedClientId?: string): string {
  const requested = requestedClientId?.trim() || undefined;

  if (user.role === Role.ADMIN) {
    const scoped = requested ?? user.clientId ?? undefined;
    if (!scoped) {
      throw new BadRequestException(
        "Admin requests must include client scope. Provide x-client-id or assign a default clientId."
      );
    }
    return scoped;
  }

  if (!user.clientId) {
    throw new ForbiddenException("Missing client scope");
  }

  if (requested && requested !== user.clientId) {
    throw new ForbiddenException("Cross-client access denied");
  }

  return user.clientId;
}
