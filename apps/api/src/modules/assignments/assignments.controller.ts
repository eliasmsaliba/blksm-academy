import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Controller("assignments")
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  // --- Learner-safe routes ---

  @Get("module/:moduleId")
  @RequirePermissions("courseModule.read", "assignment.read")
  getModuleSummary(@Param("moduleId") moduleId: string, @CurrentUser() user: RequestUser) {
    return this.assignmentsService.getModuleSummary(moduleId, user.id);
  }

  @Post(":id/submissions")
  @RequirePermissions("assignment.submit")
  submit(@Param("id") id: string, @Body() dto: CreateSubmissionDto, @CurrentUser() user: RequestUser) {
    return this.assignmentsService.submit(id, dto, user.id);
  }

  // --- Admin routes ---

  @Get("module/:moduleId/manage")
  @RequirePermissions("assignment.update")
  getModuleAdmin(@Param("moduleId") moduleId: string) {
    return this.assignmentsService.findByModuleAdmin(moduleId);
  }

  @Post()
  @RequirePermissions("assignment.create")
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: RequestUser) {
    return this.assignmentsService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("assignment.update")
  update(@Param("id") id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, dto);
  }

  // --- Grading routes (Assessor / Trainer / Department Manager via assignment.grade) ---

  @Get("grading")
  @RequirePermissions("assignment.grade")
  listPendingGrading() {
    return this.assignmentsService.listPendingGrading();
  }

  @Get("grading/:submissionId")
  @RequirePermissions("assignment.grade")
  getSubmissionForGrading(@Param("submissionId") submissionId: string) {
    return this.assignmentsService.getSubmissionForGrading(submissionId);
  }

  @Post("grading/:submissionId/grade")
  @RequirePermissions("assignment.grade")
  gradeSubmission(
    @Param("submissionId") submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, dto, user.id);
  }

  @Post("submissions/:submissionId/comments")
  @RequirePermissions("assignment.grade")
  addComment(
    @Param("submissionId") submissionId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assignmentsService.addComment(submissionId, dto, user.id);
  }
}
