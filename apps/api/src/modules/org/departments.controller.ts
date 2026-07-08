import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@Controller("departments")
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions("department.read")
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(":id")
  @RequirePermissions("department.read")
  findOne(@Param("id") id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @RequirePermissions("department.create")
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("department.update")
  update(@Param("id") id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("department.delete")
  async delete(@Param("id") id: string) {
    await this.departmentsService.delete(id);
    return { success: true };
  }
}
