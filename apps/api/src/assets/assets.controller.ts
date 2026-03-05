import { Body, Controller, Get, Headers, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AssetsService } from "./assets.service";
import { CreateAssetDto } from "./dto";
import { Roles } from "../auth/roles.decorator";
import { Role } from "@prisma/client";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { getJwtUser, resolveClientScope } from "../auth/request-context";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags("assets")
@ApiBearerAuth()
@Controller("assets")
export class AssetsController {
  constructor(private assets: AssetsService) {}

  @Get()
  @Roles(
    Role.ADMIN,
    Role.SERVICE_MANAGER,
    Role.SERVICE_DESK_ANALYST,
    Role.ENGINEER,
    Role.CLIENT_VIEWER
  )
  async list(@Req() req: any, @Headers("x-client-id") requestedClientId?: string) {
    const user = getJwtUser(req);
    const clientId = resolveClientScope(user, requestedClientId);
    return this.assets.listForClient(clientId, user.role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SERVICE_MANAGER, Role.SERVICE_DESK_ANALYST, Role.ENGINEER)
  async create(
    @Req() req: any,
    @Body() dto: CreateAssetDto,
    @Headers("x-client-id") requestedClientId?: string
  ) {
    const user = getJwtUser(req);
    const clientId = resolveClientScope(user, requestedClientId);
    return this.assets.create(dto, clientId, user.role);
  }
}
