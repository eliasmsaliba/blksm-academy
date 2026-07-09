import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { QuestionType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateQuestionDto,
  GRADABLE_QUESTION_TYPES,
  MANUALLY_GRADED_QUESTION_TYPES,
} from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

const SUPPORTED_QUESTION_TYPES = [...GRADABLE_QUESTION_TYPES, ...MANUALLY_GRADED_QUESTION_TYPES];

function assertSupported(questionType: QuestionType) {
  if (!SUPPORTED_QUESTION_TYPES.includes(questionType as (typeof SUPPORTED_QUESTION_TYPES)[number])) {
    throw new BadRequestException(
      `Question type ${questionType} is not supported yet — only MCQ_SINGLE, MCQ_MULTI, TRUE_FALSE, SHORT_ANSWER and ESSAY are.`,
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
    assertSupported(dto.questionType);
    return this.prisma.question.create({
      data: {
        questionType: dto.questionType,
        promptText: { text: dto.promptText },
        points: dto.points ?? 1,
        gradingGuidance: dto.gradingGuidance,
        createdById: userId,
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

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);
    if (dto.questionType) assertSupported(dto.questionType);

    if (dto.options) {
      await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        questionType: dto.questionType,
        promptText: dto.promptText !== undefined ? { text: dto.promptText } : undefined,
        points: dto.points,
        gradingGuidance: dto.gradingGuidance,
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
