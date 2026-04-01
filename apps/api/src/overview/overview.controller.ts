import { Controller, Get, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/jwt.guard"
import { RolesGuard } from "../auth/roles.guard"
import { Roles } from "../auth/roles.decorator"
import { Role } from "@prisma/client"
import { OverviewService } from "./overview.service"

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags("overview")
@ApiBearerAuth()
@Controller("overview")
export class OverviewController {
  constructor(private overview: OverviewService) {}

  @Get()
  @Roles(Role.ORG_OWNER, Role.ORG_ADMIN, Role.ADMIN)
  async get() {
    return this.overview.getOverview()
  }
}