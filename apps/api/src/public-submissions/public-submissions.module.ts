import { Module } from "@nestjs/common";
import { PublicSubmissionsController } from "./public-submissions.controller";
import { PublicSubmissionsService } from "./public-submissions.service";

@Module({
  controllers: [PublicSubmissionsController],
  providers: [PublicSubmissionsService]
})
export class PublicSubmissionsModule {}
