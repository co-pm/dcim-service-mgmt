import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private assertClientScope(clientId: string) {
    if (!clientId) throw new ForbiddenException("Missing client scope");
  }

  listForClient(clientId: string) {
    this.assertClientScope(clientId);
    return this.prisma.documentReference.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" }
    });
  }

  createForClient(clientId: string, dto: any) {
    this.assertClientScope(clientId);
    return this.prisma.documentReference.create({
      data: {
        clientId,
        title: dto.title,
        url: dto.url,
        docType: dto.docType,
        version: dto.version,
        linkedEntityType: dto.linkedEntityType,
        linkedEntityId: dto.linkedEntityId
      }
    });
  }
}
