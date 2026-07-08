import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { LessonsService } from "./lessons.service";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";

@Controller("lessons")
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get()
  @RequirePermissions("lesson.read")
  findByModule(@Query("courseModuleId") courseModuleId: string) {
    return this.lessonsService.findByModule(courseModuleId);
  }

  @Get(":id")
  @RequirePermissions("lesson.read")
  findOne(@Param("id") id: string) {
    return this.lessonsService.findOne(id);
  }

  @Post()
  @RequirePermissions("lesson.create")
  create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("lesson.update")
  update(@Param("id") id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("lesson.delete")
  async delete(@Param("id") id: string) {
    await this.lessonsService.delete(id);
    return { success: true };
  }
}
