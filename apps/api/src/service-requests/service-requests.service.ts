import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ServiceRequestStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

function makeRef() {
  const d = new Date();
  const y = d.getFullYear();
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `SR-${y}-${n}`;
}

@Injectable()
export class ServiceRequestsService {
  constructor(private prisma: PrismaService) {}

  private assertClientScope(clientId: string) {
    if (!clientId) throw new ForbiddenException("Missing client scope");
  }

  async listForClient(clientId: string) {
    this.assertClientScope(clientId);
    return this.prisma.serviceRequest.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" }
    });
  }

  async createForClient(clientId: string, createdById: string | null, dto: any) {
    this.assertClientScope(clientId);
    const sr = await this.prisma.serviceRequest.create({
      data: {
        reference: makeRef(),
        clientId,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority ?? "medium",
        createdById
      }
    });

    await this.prisma.auditEvent.create({
      data: {
        entityType: "ServiceRequest",
        entityId: sr.id,
        action: "CREATED",
        actorUserId: createdById ?? undefined,
        clientId,
        data: { reference: sr.reference, subject: sr.subject },
        serviceRequestId: sr.id
      }
    });

    return sr;
  }

  async getForClient(clientId: string, id: string) {
    this.assertClientScope(clientId);
    const sr = await this.prisma.serviceRequest.findFirst({ where: { id, clientId } });
    if (!sr) throw new NotFoundException("Service Request not found");
    return sr;
  }

  async closeForClient(clientId: string, id: string, actorUserId: string, closureSummary: string) {
    this.assertClientScope(clientId);
    if (!closureSummary || closureSummary.trim().length < 5) {
      throw new BadRequestException("Closure summary is required to close a Service Request.");
    }

    const sr = await this.getForClient(clientId, id);

    const updated = await this.prisma.serviceRequest.update({
      where: { id: sr.id },
      data: {
        status: ServiceRequestStatus.CLOSED,
        closureSummary
      }
    });

    await this.prisma.auditEvent.create({
      data: {
        entityType: "ServiceRequest",
        entityId: sr.id,
        action: "CLOSED",
        actorUserId,
        clientId,
        data: { closureSummary },
        serviceRequestId: sr.id
      }
    });

    return updated;
  }
}
