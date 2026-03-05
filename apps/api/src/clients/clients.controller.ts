import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ClientsService } from "./clients.service";
import { Roles } from "../auth/roles.decorator";
import { Role } from "@prisma/client";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CreateClientDto, UpdateClientDto } from "./dto";
import { getJwtUser } from "../auth/request-context";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags("clients")
@ApiBearerAuth()
@Controller("clients")
export class ClientsController {
  constructor(private clients: ClientsService) {}

  @Get()
  @Roles(Role.ADMIN)
  async list(@Req() req: any) {
    const actor = getJwtUser(req);
    return this.clients.list(actor);
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  async get(@Req() req: any, @Param("id") id: string) {
    const actor = getJwtUser(req);
    return this.clients.get(actor, id);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Req() req: any, @Body() dto: CreateClientDto) {
    const actor = getJwtUser(req);
    return this.clients.create(actor, dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  async update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateClientDto) {
    const actor = getJwtUser(req);
    return this.clients.update(actor, id, dto);
  }
}
