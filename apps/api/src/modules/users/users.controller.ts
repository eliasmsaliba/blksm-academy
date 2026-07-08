import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AssignRoleDto } from "./dto/assign-role.dto";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions("user.read")
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @RequirePermissions("user.read")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions("user.create", "user.invite")
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("user.update")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(":id/roles")
  @RequirePermissions("role.assign")
  assignRole(@Param("id") id: string, @Body() dto: AssignRoleDto) {
    return this.usersService.assignRole(id, dto.roleId);
  }

  @Delete(":id/roles/:roleId")
  @RequirePermissions("role.assign")
  revokeRole(@Param("id") id: string, @Param("roleId") roleId: string) {
    return this.usersService.revokeRole(id, roleId);
  }

  @Delete(":id")
  @RequirePermissions("user.delete")
  async delete(@Param("id") id: string) {
    await this.usersService.delete(id);
    return { success: true };
  }
}
