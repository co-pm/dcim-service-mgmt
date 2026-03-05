import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ClientsService } from "./clients.service";
import { Roles } from "../auth/roles.decorator";
import { Role } from "@prisma/client";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CreateClientDto, UpdateClientDto } from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags("clients")
@ApiBearerAuth()
@Controller("clients")
export class ClientsController {
  constructor(private clients: ClientsService) {}

  @Get()
  @Roles(Role.ADMIN)
  async list() {
    return this.clients.list();
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  async get(@Param("id") id: string) {
    return this.clients.get(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateClientDto) {
    return this.clients.create(dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  async update(@Param("id") id: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(id, dto);
  }
}
