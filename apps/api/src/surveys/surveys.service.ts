import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SurveyItemResponse, SurveyStatus } from "@prisma/client";

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

  async getForClient(clientId: string, id: string) {
    this.assertClientScope(clientId);
    const survey = await this.prisma.survey.findFirst({
      where: { id, clientId },
      include: { items: true }
    });
    if (!survey) throw new NotFoundException("Survey not found");
    return survey;
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

  async startSurvey(clientId: string, surveyId: string) {
    const survey = await this.getForClient(clientId, surveyId);

    if (survey.status === SurveyStatus.COMPLETED) {
      throw new BadRequestException("Completed surveys cannot be restarted.");
    }

    if (survey.status === SurveyStatus.IN_PROGRESS) return survey;

    return this.prisma.survey.update({
      where: { id: survey.id },
      data: { status: SurveyStatus.IN_PROGRESS }
    });
  }

  async addItem(clientId: string, surveyId: string, dto: { label: string }) {
    if (!dto.label?.trim()) throw new BadRequestException("Item label is required.");

    const survey = await this.getForClient(clientId, surveyId);
    if (survey.status === SurveyStatus.COMPLETED) {
      throw new BadRequestException("Cannot add items to a completed survey.");
    }

    return this.prisma.surveyItem.create({
      data: {
        surveyId: survey.id,
        label: dto.label.trim()
      }
    });
  }

  async updateItem(
    clientId: string,
    surveyId: string,
    itemId: string,
    dto: { response?: SurveyItemResponse; notes?: string; photoObjectKey?: string }
  ) {
    const survey = await this.getForClient(clientId, surveyId);
    if (survey.status === SurveyStatus.COMPLETED) {
      throw new BadRequestException("Cannot update items on a completed survey.");
    }

    const item = await this.prisma.surveyItem.findFirst({
      where: { id: itemId, surveyId: survey.id }
    });
    if (!item) throw new NotFoundException("Survey item not found");

    return this.prisma.surveyItem.update({
      where: { id: item.id },
      data: {
        response: dto.response ?? item.response,
        notes: dto.notes ?? item.notes,
        photoObjectKey: dto.photoObjectKey ?? item.photoObjectKey
      }
    });
  }

  async completeSurvey(clientId: string, surveyId: string) {
    const survey = await this.getForClient(clientId, surveyId);

    if (survey.items.length === 0) {
      throw new BadRequestException("Survey cannot be completed without checklist items.");
    }

    const allReviewed = survey.items.every((i) => i.response !== null);
    if (!allReviewed) {
      throw new BadRequestException("Survey cannot be completed until all items have a response.");
    }

    return this.prisma.survey.update({
      where: { id: surveyId },
      data: { status: SurveyStatus.COMPLETED }
    });
  }

  async deleteForClient(clientId: string, surveyId: string) {
    const survey = await this.getForClient(clientId, surveyId);
    return this.prisma.survey.delete({
      where: { id: survey.id }
    });
  }
}
