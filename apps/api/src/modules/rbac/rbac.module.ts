import { Module } from "@nestjs/common";
import { PermissionsService } from "./permissions.service";
import { RolesService } from "./roles.service";
import { RolesController } from "./roles.controller";

@Module({
  controllers: [RolesController],
  providers: [PermissionsService, RolesService],
  exports: [PermissionsService],
})
export class RbacModule {}
