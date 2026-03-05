import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ConvertPublicSubmissionDto, CreatePublicSubmissionDto } from "./dto";
import { PublicSubmissionsService } from "./public-submissions.service";

@ApiTags("public-submissions")
@Controller("public-submissions")
export class PublicSubmissionsController {
  constructor(private submissions: PublicSubmissionsService) {}

  @Post("public")
  async createPublic(@Body() dto: CreatePublicSubmissionDto) {
    if (!dto.clientId) throw new BadRequestException("clientId is required");
    return this.submissions.createPublic(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get()
  @Roles(Role.ADMIN, Role.SERVICE_MANAGER, Role.SERVICE_DESK_ANALYST)
  async list(@Req() req: any, @Headers("x-client-id") requestedClientId?: string) {
    const clientId = this.resolveClientScope(req.user, requestedClientId);
    return this.submissions.listForClient(clientId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post(":id/convert")
  @Roles(Role.ADMIN, Role.SERVICE_MANAGER, Role.SERVICE_DESK_ANALYST)
  async convert(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: ConvertPublicSubmissionDto,
    @Headers("x-client-id") requestedClientId?: string
  ) {
    const clientId = this.resolveClientScope(req.user, requestedClientId);
    const actorUserId = req.user?.userId;
    if (!actorUserId) throw new ForbiddenException("Missing user context");

    return this.submissions.convertForClient(clientId, id, actorUserId, dto.priority);
  }

  private resolveClientScope(user: any, requestedClientId?: string) {
    const requested = requestedClientId?.trim();
    const role = user?.role as Role | undefined;
    const userClientId = user?.clientId as string | undefined;

    if (!role) throw new ForbiddenException("Missing role");

    if (role === Role.ADMIN) {
      const scoped = requested || userClientId;
      if (!scoped) {
        throw new BadRequestException("Admin requests need x-client-id or user clientId");
      }
      return scoped;
    }

    if (!userClientId) throw new ForbiddenException("Missing client scope");
    if (requested && requested !== userClientId) {
      throw new ForbiddenException("Cross-client access denied");
    }
    return userClientId;
  }
}
