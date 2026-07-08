import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";

@Controller("roles")
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermissions("role.read")
  findAll() {
    return this.rolesService.findAll();
  }

  @Get("permissions")
  @RequirePermissions("permission.read")
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get(":id")
  @RequirePermissions("role.read")
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions("role.create")
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(":id/permissions")
  @RequirePermissions("role.update")
  setPermissions(@Param("id") id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.setPermissions(id, dto.permissionKeys);
  }

  @Delete(":id")
  @RequirePermissions("role.delete")
  async delete(@Param("id") id: string) {
    await this.rolesService.delete(id);
    return { success: true };
  }
}
