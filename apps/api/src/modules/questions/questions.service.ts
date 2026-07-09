import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { QuestionType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateQuestionDto, GRADABLE_QUESTION_TYPES } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

function assertGradable(questionType: QuestionType) {
  if (!GRADABLE_QUESTION_TYPES.includes(questionType as (typeof GRADABLE_QUESTION_TYPES)[number])) {
    throw new BadRequestException(
      `Question type ${questionType} is not supported yet — only MCQ_SINGLE, MCQ_MULTI and TRUE_FALSE are auto-gradable.`,
    );
  }
}

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  findMany(filters: { questionType?: QuestionType; isActive?: boolean }) {
    return this.prisma.question.findMany({
      where: {
        questionType: filters.questionType,
        isActive: filters.isActive ?? true,
      },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: "asc" } } },
    });
    if (!question) throw new NotFoundException("Question not found");
    return question;
  }

  create(dto: CreateQuestionDto, userId: string) {
    assertGradable(dto.questionType);
    return this.prisma.question.create({
      data: {
        questionType: dto.questionType,
        promptText: { text: dto.promptText },
        points: dto.points ?? 1,
        createdById: userId,
        options: {
          create: dto.options.map((o, i) => ({
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            order: o.order ?? i,
          })),
        },
      },
      include: { options: { orderBy: { order: "asc" } } },
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);
    if (dto.questionType) assertGradable(dto.questionType);

    if (dto.options) {
      await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        questionType: dto.questionType,
        promptText: dto.promptText !== undefined ? { text: dto.promptText } : undefined,
        points: dto.points,
        isActive: dto.isActive,
        options: dto.options
          ? {
              create: dto.options.map((o, i) => ({
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                order: o.order ?? i,
              })),
            }
          : undefined,
      },
      include: { options: { orderBy: { order: "asc" } } },
    });
  }
}
