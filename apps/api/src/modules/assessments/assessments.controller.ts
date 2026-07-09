import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AssessmentsService } from "./assessments.service";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { UpdateAssessmentDto } from "./dto/update-assessment.dto";
import { AddAssessmentQuestionDto } from "./dto/add-assessment-question.dto";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto";

@Controller("assessments")
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  // --- Learner-safe routes: never expose isCorrect / correct answers pre-submission ---

  @Get("lesson/:lessonId")
  @RequirePermissions("lesson.read", "assessment.read")
  getLearnerSummary(@Param("lessonId") lessonId: string, @CurrentUser() user: RequestUser) {
    return this.assessmentsService.getLearnerSummary(lessonId, user.id);
  }

  @Post("lesson/:lessonId/attempts")
  @RequirePermissions("assessment.attempt")
  startAttempt(@Param("lessonId") lessonId: string, @CurrentUser() user: RequestUser) {
    return this.assessmentsService.startOrResumeAttempt(lessonId, user.id);
  }

  @Post("attempts/:attemptId/submit")
  @RequirePermissions("assessment.attempt")
  submitAttempt(
    @Param("attemptId") attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentsService.submitAttempt(attemptId, dto, user.id);
  }

  // --- Admin routes: full detail including isCorrect / answer keys ---

  @Get("lesson/:lessonId/manage")
  @RequirePermissions("assessment.update")
  getForLessonAdmin(@Param("lessonId") lessonId: string) {
    return this.assessmentsService.findByLessonAdmin(lessonId);
  }

  @Post()
  @RequirePermissions("assessment.create")
  create(@Body() dto: CreateAssessmentDto, @CurrentUser() user: RequestUser) {
    return this.assessmentsService.createForLesson(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("assessment.update")
  update(@Param("id") id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, dto);
  }

  @Post(":id/questions")
  @RequirePermissions("assessment.update")
  addQuestion(@Param("id") id: string, @Body() dto: AddAssessmentQuestionDto) {
    return this.assessmentsService.addQuestion(id, dto);
  }

  @Delete(":id/questions/:questionId")
  @RequirePermissions("assessment.update")
  async removeQuestion(@Param("id") id: string, @Param("questionId") questionId: string) {
    await this.assessmentsService.removeQuestion(id, questionId);
    return { success: true };
  }
}
