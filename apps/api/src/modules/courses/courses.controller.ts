import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@Controller("courses")
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @RequirePermissions("course.read")
  findByAcademy(@Query("academyId") academyId: string) {
    return this.coursesService.findByAcademy(academyId);
  }

  @Get(":id")
  @RequirePermissions("course.read")
  findOne(@Param("id") id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @RequirePermissions("course.create")
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: RequestUser) {
    return this.coursesService.create(dto, user);
  }

  @Patch(":id")
  @RequirePermissions("course.update")
  update(@Param("id") id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("course.delete")
  async delete(@Param("id") id: string) {
    await this.coursesService.delete(id);
    return { success: true };
  }
}
