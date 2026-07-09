import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { QuestionType } from "@prisma/client";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { QuestionsService } from "./questions.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

@Controller("questions")
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  @RequirePermissions("question.read")
  findMany(
    @Query("questionType") questionType?: QuestionType,
    @Query("isActive") isActive?: string,
  ) {
    return this.questionsService.findMany({
      questionType,
      isActive: isActive === undefined ? undefined : isActive === "true",
    });
  }

  @Get(":id")
  @RequirePermissions("question.read")
  findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }

  @Post()
  @RequirePermissions("question.create")
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: RequestUser) {
    return this.questionsService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("question.update")
  update(@Param("id") id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }
}
