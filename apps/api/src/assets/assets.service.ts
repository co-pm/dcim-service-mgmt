import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OwnerType, Role } from "@prisma/client";

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  listForClient(clientId: string, role: Role) {
    if (!clientId) throw new ForbiddenException("Missing client scope");

    if (role !== Role.ADMIN) {
      // Harden tenancy: non-admin users can only access client-owned assets in their scope.
      return this.prisma.asset.findMany({
        where: {
          ownerType: OwnerType.CLIENT,
          clientId
        },
        orderBy: { updatedAt: "desc" }
      });
    }

    // Admin can see internal assets plus client-owned assets for the selected client scope.
    return this.prisma.asset.findMany({
      where: {
        OR: [
          { ownerType: OwnerType.INTERNAL },
          { ownerType: OwnerType.CLIENT, clientId }
        ]
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  async create(dto: any, requesterClientId: string, requesterRole: Role) {
    if (!requesterClientId) throw new ForbiddenException("Missing client scope");

    if (dto.ownerType === OwnerType.CLIENT && !dto.clientId) {
      // If owner=CLIENT, must link to a client
      throw new BadRequestException("clientId is required when ownerType is CLIENT.");
    }

    // Enforce that non-admin cannot create assets for other clients.
    if (
      requesterRole !== Role.ADMIN &&
      dto.ownerType === OwnerType.CLIENT &&
      dto.clientId !== requesterClientId
    ) {
      throw new ForbiddenException("Cannot create client-owned asset for a different client.");
    }

    // Restrict internal-asset creation to admins.
    if (dto.ownerType === OwnerType.INTERNAL && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException("Only admins can create INTERNAL assets.");
    }

    return this.prisma.asset.create({
      data: {
        assetTag: dto.assetTag,
        name: dto.name,
        assetType: dto.assetType,
        ownerType: dto.ownerType,
        clientId: dto.ownerType === OwnerType.CLIENT ? dto.clientId : null,
        location: dto.location
      }
    });
  }
}
