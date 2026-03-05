import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SurveyStatus } from "@prisma/client";

@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}

  private assertClientScope(clientId: string) {
    if (!clientId) throw new ForbiddenException("Missing client scope");
  }

  listForClient(clientId: string) {
    this.assertClientScope(clientId);
    return this.prisma.survey.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
      include: { items: true }
    });
  }

  async createForClient(clientId: string, dto: any) {
    this.assertClientScope(clientId);
    return this.prisma.survey.create({
      data: {
        clientId,
        title: dto.title,
        surveyType: dto.surveyType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        status: SurveyStatus.DRAFT,
        items: { create: [] }
      }
    });
  }

  async completeSurvey(clientId: string, surveyId: string) {
    this.assertClientScope(clientId);
    const survey = await this.prisma.survey.findFirst({
      where: { id: surveyId, clientId },
      include: { items: true }
    });
    if (!survey) throw new BadRequestException("Survey not found");

    const allReviewed = survey.items.every((i) => i.response !== null);
    if (!allReviewed) {
      throw new BadRequestException("Survey cannot be completed until all items have a response.");
    }

    return this.prisma.survey.update({
      where: { id: surveyId },
      data: { status: SurveyStatus.COMPLETED }
    });
  }
}
