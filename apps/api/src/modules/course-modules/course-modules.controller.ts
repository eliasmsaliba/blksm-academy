import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CourseModulesService } from "./course-modules.service";
import { CreateCourseModuleDto } from "./dto/create-course-module.dto";
import { UpdateCourseModuleDto } from "./dto/update-course-module.dto";

@Controller("course-modules")
export class CourseModulesController {
  constructor(private courseModulesService: CourseModulesService) {}

  @Get()
  @RequirePermissions("courseModule.read")
  findByCourse(@Query("courseId") courseId: string) {
    return this.courseModulesService.findByCourse(courseId);
  }

  @Get(":id")
  @RequirePermissions("courseModule.read")
  findOne(@Param("id") id: string) {
    return this.courseModulesService.findOne(id);
  }

  @Post()
  @RequirePermissions("courseModule.create")
  create(@Body() dto: CreateCourseModuleDto) {
    return this.courseModulesService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("courseModule.update")
  update(@Param("id") id: string, @Body() dto: UpdateCourseModuleDto) {
    return this.courseModulesService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("courseModule.delete")
  async delete(@Param("id") id: string) {
    await this.courseModulesService.delete(id);
    return { success: true };
  }
}
