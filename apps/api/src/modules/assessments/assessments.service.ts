import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GradingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { GRADABLE_QUESTION_TYPES } from "../questions/dto/create-question.dto";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { UpdateAssessmentDto } from "./dto/update-assessment.dto";
import { AddAssessmentQuestionDto } from "./dto/add-assessment-question.dto";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto";

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((v) => setB.has(v));
}

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async findByLessonAdmin(lessonId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { lessonId },
      include: {
        assessmentQuestions: {
          orderBy: { order: "asc" },
          include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
        },
      },
    });
    return assessment;
  }

  async getLearnerSummary(lessonId: string, userId: string) {
    const assessment = await this.prisma.assessment.findFirst({ where: { lessonId } });
    if (!assessment) return null;

    const [questionCount, attempts] = await Promise.all([
      this.prisma.assessmentQuestion.count({ where: { assessmentId: assessment.id } }),
      this.prisma.assessmentAttempt.findMany({
        where: { assessmentId: assessment.id, userId },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    const completed = attempts.filter((a) => a.submittedAt);
    const inProgress = attempts.find((a) => !a.submittedAt);
    const bestScore = completed.length ? Math.max(...completed.map((a) => a.score ?? 0)) : null;
    const passed = completed.some((a) => a.passed);
    const attemptsUsed = attempts.length;
    const attemptsRemaining = assessment.maxAttempts
      ? Math.max(0, assessment.maxAttempts - attemptsUsed)
      : null;

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      passMarkPercent: assessment.passMarkPercent,
      maxAttempts: assessment.maxAttempts,
      questionCount,
      attemptsUsed,
      attemptsRemaining,
      bestScore,
      passed,
      hasInProgressAttempt: Boolean(inProgress),
      inProgressAttemptId: inProgress?.id ?? null,
    };
  }

  async createForLesson(dto: CreateAssessmentDto, userId: string) {
    const existing = await this.prisma.assessment.findFirst({ where: { lessonId: dto.lessonId } });
    if (existing) throw new ConflictException("This lesson already has a Knowledge Check");

    return this.prisma.assessment.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        description: dto.description,
        passMarkPercent: dto.passMarkPercent ?? 70,
        maxAttempts: dto.maxAttempts,
        assessmentKind: "ASSESSMENT",
        status: "PUBLISHED",
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    await this.findOrThrow(id);
    return this.prisma.assessment.update({ where: { id }, data: dto });
  }

  async addQuestion(assessmentId: string, dto: AddAssessmentQuestionDto) {
    await this.findOrThrow(assessmentId);
    const question = await this.prisma.question.findUnique({ where: { id: dto.questionId } });
    if (!question) throw new NotFoundException("Question not found");
    if (!GRADABLE_QUESTION_TYPES.includes(question.questionType as (typeof GRADABLE_QUESTION_TYPES)[number])) {
      throw new BadRequestException("Only MCQ/True-False questions can be added to a Knowledge Check");
    }

    const count = await this.prisma.assessmentQuestion.count({ where: { assessmentId } });
    return this.prisma.assessmentQuestion.upsert({
      where: { assessmentId_questionId: { assessmentId, questionId: dto.questionId } },
      create: {
        assessmentId,
        questionId: dto.questionId,
        order: dto.order ?? count,
        pointsOverride: dto.pointsOverride,
      },
      update: { order: dto.order, pointsOverride: dto.pointsOverride },
    });
  }

  async removeQuestion(assessmentId: string, questionId: string) {
    await this.prisma.assessmentQuestion.deleteMany({ where: { assessmentId, questionId } });
  }

  async startOrResumeAttempt(lessonId: string, userId: string) {
    const assessment = await this.prisma.assessment.findFirst({ where: { lessonId } });
    if (!assessment) throw new NotFoundException("This lesson has no Knowledge Check");

    let attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { assessmentId: assessment.id, userId, submittedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (!attempt) {
      const totalAttempts = await this.prisma.assessmentAttempt.count({
        where: { assessmentId: assessment.id, userId },
      });
      if (assessment.maxAttempts && totalAttempts >= assessment.maxAttempts) {
        throw new ForbiddenException("No attempts remaining for this Knowledge Check");
      }
      attempt = await this.prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          userId,
          attemptNumber: totalAttempts + 1,
        },
      });
    }

    const assessmentQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId: assessment.id },
      orderBy: { order: "asc" },
      include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
    });

    return {
      attemptId: attempt.id,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        passMarkPercent: assessment.passMarkPercent,
      },
      questions: assessmentQuestions.map((aq) => ({
        id: aq.question.id,
        questionType: aq.question.questionType,
        promptText: aq.question.promptText,
        points: aq.pointsOverride ?? aq.question.points,
        options: aq.question.options.map((o) => ({ id: o.id, optionText: o.optionText, order: o.order })),
      })),
    };
  }

  async submitAttempt(attemptId: string, dto: SubmitAttemptDto, userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException("Attempt not found");
    if (attempt.submittedAt) throw new ConflictException("This attempt has already been submitted");

    const assessment = await this.prisma.assessment.findUniqueOrThrow({
      where: { id: attempt.assessmentId },
    });

    const assessmentQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId: attempt.assessmentId },
      include: { question: { include: { options: true } } },
    });

    let totalPossible = 0;
    let totalAwarded = 0;
    const perQuestion: {
      questionId: string;
      isCorrect: boolean;
      selectedOptionIds: string[];
      correctOptionIds: string[];
    }[] = [];

    const answerRows: {
      attemptId: string;
      questionId: string;
      responseData: { selectedOptionIds: string[] };
      isCorrect: boolean;
      pointsAwarded: number;
    }[] = [];

    for (const aq of assessmentQuestions) {
      const points = aq.pointsOverride ?? aq.question.points;
      totalPossible += points;
      const submitted = dto.answers.find((a) => a.questionId === aq.questionId);
      const selectedOptionIds = submitted?.selectedOptionIds ?? [];
      const correctOptionIds = aq.question.options.filter((o) => o.isCorrect).map((o) => o.id);
      const isCorrect = sameSet(selectedOptionIds, correctOptionIds);
      const pointsAwarded = isCorrect ? points : 0;
      totalAwarded += pointsAwarded;

      answerRows.push({
        attemptId,
        questionId: aq.questionId,
        responseData: { selectedOptionIds },
        isCorrect,
        pointsAwarded,
      });
      perQuestion.push({ questionId: aq.questionId, isCorrect, selectedOptionIds, correctOptionIds });
    }

    const score = totalPossible > 0 ? (totalAwarded / totalPossible) * 100 : 0;
    const passed = score >= assessment.passMarkPercent;

    await this.prisma.$transaction([
      this.prisma.assessmentAnswer.createMany({ data: answerRows }),
      this.prisma.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          score,
          passed,
          gradingStatus: GradingStatus.AUTO_GRADED,
        },
      }),
    ]);

    return { score, passed, passMarkPercent: assessment.passMarkPercent, perQuestion };
  }

  private async findOrThrow(id: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException("Assessment not found");
    return assessment;
  }
}
