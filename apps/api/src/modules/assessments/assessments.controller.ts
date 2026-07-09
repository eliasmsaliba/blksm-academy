import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AssessmentsService } from "./assessments.service";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { UpdateAssessmentDto } from "./dto/update-assessment.dto";
import { AddAssessmentQuestionDto } from "./dto/add-assessment-question.dto";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto";
import { GradeAnswerDto } from "./dto/grade-answer.dto";

@Controller("assessments")
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  // --- Learner-safe routes: never expose isCorrect / correct answers / gradingGuidance pre-submission ---

  @Get("lesson/:lessonId")
  @RequirePermissions("lesson.read", "assessment.read")
  getLearnerSummaryForLesson(@Param("lessonId") lessonId: string, @CurrentUser() user: RequestUser) {
    return this.assessmentsService.getLearnerSummary({ lessonId }, user.id);
  }

  @Post("lesson/:lessonId/attempts")
  @RequirePermissions("assessment.attempt")
  async startAttemptForLesson(@Param("lessonId") lessonId: string, @CurrentUser() user: RequestUser) {
    const assessmentId = await this.assessmentsService.findAssessmentIdByScope({ lessonId });
    return this.assessmentsService.startOrResumeAttempt(assessmentId, user.id);
  }

  @Get("module/:moduleId")
  @RequirePermissions("courseModule.read", "assessment.read")
  getLearnerSummaryForModule(@Param("moduleId") moduleId: string, @CurrentUser() user: RequestUser) {
    return this.assessmentsService.getLearnerSummary({ courseModuleId: moduleId }, user.id);
  }

  @Post("module/:moduleId/attempts")
  @RequirePermissions("assessment.attempt")
  async startAttemptForModule(@Param("moduleId") moduleId: string, @CurrentUser() user: RequestUser) {
    const assessmentId = await this.assessmentsService.findAssessmentIdByScope({ courseModuleId: moduleId });
    return this.assessmentsService.startOrResumeAttempt(assessmentId, user.id);
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
    return this.assessmentsService.findManageView({ lessonId });
  }

  @Get("module/:moduleId/manage")
  @RequirePermissions("assessment.update")
  getForModuleAdmin(@Param("moduleId") moduleId: string) {
    return this.assessmentsService.findManageView({ courseModuleId: moduleId });
  }

  @Post()
  @RequirePermissions("assessment.create")
  create(@Body() dto: CreateAssessmentDto, @CurrentUser() user: RequestUser) {
    return this.assessmentsService.create(dto, user.id);
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

  // --- Grading routes (Assessor / Trainer / Department Manager via assessment.grade) ---

  @Get("grading")
  @RequirePermissions("assessment.grade")
  listPendingGrading() {
    return this.assessmentsService.listPendingGrading();
  }

  @Get("grading/:attemptId")
  @RequirePermissions("assessment.grade")
  getAttemptForGrading(@Param("attemptId") attemptId: string) {
    return this.assessmentsService.getAttemptForGrading(attemptId);
  }

  @Post("grading/:attemptId/answers/:answerId")
  @RequirePermissions("assessment.grade")
  gradeAnswer(
    @Param("attemptId") attemptId: string,
    @Param("answerId") answerId: string,
    @Body() dto: GradeAnswerDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentsService.gradeAnswer(attemptId, answerId, dto, user.id);
  }

  @Post("grading/:attemptId/finalize")
  @RequirePermissions("assessment.grade")
  finalizeAttempt(@Param("attemptId") attemptId: string) {
    return this.assessmentsService.finalizeAttempt(attemptId);
  }
}
