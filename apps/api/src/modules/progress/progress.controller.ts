import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { ProgressService } from "./progress.service";
import { UpdateLessonProgressDto } from "./dto/update-lesson-progress.dto";

@Controller("progress")
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get("courses/:courseId/me")
  getMyCourseProgress(@Param("courseId") courseId: string, @CurrentUser() user: RequestUser) {
    return this.progressService.getCourseProgress(user.id, courseId);
  }

  @Put("lessons/:lessonId")
  setLessonProgress(
    @Param("lessonId") lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.progressService.setLessonProgress(user.id, lessonId, dto);
  }
}
