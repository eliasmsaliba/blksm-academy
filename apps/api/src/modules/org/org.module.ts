import { Module } from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { DepartmentsController } from "./departments.controller";
import { PositionsService } from "./positions.service";
import { PositionsController } from "./positions.controller";

@Module({
  controllers: [DepartmentsController, PositionsController],
  providers: [DepartmentsService, PositionsService],
  exports: [DepartmentsService, PositionsService],
})
export class OrgModule {}
