import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class OverviewService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const clients = await this.prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true }
    })

    const now = new Date()

    const clientStats = await Promise.all(clients.map(async client => {
      const [openSRs, openIncidents, criticalIncidents, overdueTasks,
             pendingReviewChecks, oldPendingChecks, lastActivity] = await Promise.all([
        this.prisma.serviceRequest.count({
          where: { clientId: client.id, status: { notIn: ["CLOSED", "COMPLETED"] } }
        }),
        this.prisma.incident.count({
          where: { clientId: client.id, status: { notIn: ["RESOLVED", "CLOSED"] } }
        }),
        this.prisma.incident.count({
          where: { clientId: client.id, severity: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } }
        }),
        this.prisma.task.count({
          where: { clientId: client.id, status: { notIn: ["DONE"] }, dueAt: { lt: now } }
        }),
        this.prisma.check.count({
          where: { clientId: client.id, status: "PENDING_REVIEW" }
        }),
        this.prisma.check.count({
          where: {
            clientId: client.id, status: "PENDING_REVIEW",
            updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
          }
        }),
        this.prisma.serviceRequest.findFirst({
          where: { clientId: client.id },
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true }
        })
      ])

      // RAG: red if critical incident or old pending check, amber if any overdue/pending, green otherwise
      const rag = criticalIncidents > 0 || oldPendingChecks > 0 ? "red"
        : overdueTasks > 0 || pendingReviewChecks > 0 ? "amber"
        : "green"

      return {
        client,
        rag,
        openSRs,
        openIncidents,
        criticalIncidents,
        overdueTasks,
        pendingReviewChecks,
        oldPendingChecks,
        lastActivity: lastActivity?.updatedAt ?? null
      }
    }))

    // Attention items — red first, then amber
    const attentionItems: Array<{
      severity: "red" | "amber"
      message: string
      clientName: string
      reference?: string
      entityType: string
      entityId: string
    }> = []

    for (const cs of clientStats) {
      if (cs.criticalIncidents > 0) {
        const inc = await this.prisma.incident.findFirst({
          where: { clientId: cs.client.id, severity: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } },
          orderBy: { createdAt: "asc" },
          select: { id: true, reference: true, title: true }
        })
        if (inc) attentionItems.push({
          severity: "red",
          message: `Critical incident open`,
          clientName: cs.client.name,
          reference: inc.reference,
          entityType: "incident",
          entityId: inc.id
        })
      }
      if (cs.oldPendingChecks > 0) {
        const chk = await this.prisma.check.findFirst({
          where: {
            clientId: cs.client.id, status: "PENDING_REVIEW",
            updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
          },
          orderBy: { updatedAt: "asc" },
          select: { id: true, reference: true, title: true }
        })
        if (chk) attentionItems.push({
          severity: "amber",
          message: `Check pending review >3 days`,
          clientName: cs.client.name,
          reference: chk.reference,
          entityType: "check",
          entityId: chk.id
        })
      }
      if (cs.overdueTasks > 0) {
        attentionItems.push({
          severity: "amber",
          message: `${cs.overdueTasks} task${cs.overdueTasks > 1 ? "s" : ""} overdue`,
          clientName: cs.client.name,
          entityType: "tasks",
          entityId: cs.client.id
        })
      }
      if (cs.pendingReviewChecks > 0 && cs.oldPendingChecks === 0) {
        attentionItems.push({
          severity: "amber",
          message: `${cs.pendingReviewChecks} check${cs.pendingReviewChecks > 1 ? "s" : ""} pending review`,
          clientName: cs.client.name,
          entityType: "checks",
          entityId: cs.client.id
        })
      }
    }

    attentionItems.sort((a, b) => (a.severity === "red" ? -1 : 1))

    return { clientStats, attentionItems }
  }
}