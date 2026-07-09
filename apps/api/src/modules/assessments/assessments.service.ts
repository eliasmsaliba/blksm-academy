import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Assessment, AssessmentAttempt, GradingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  GRADABLE_QUESTION_TYPES,
  MANUALLY_GRADED_QUESTION_TYPES,
} from "../questions/dto/create-question.dto";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { UpdateAssessmentDto } from "./dto/update-assessment.dto";
import { AddAssessmentQuestionDto } from "./dto/add-assessment-question.dto";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto";
import { GradeAnswerDto } from "./dto/grade-answer.dto";

type AssessmentScope = { lessonId?: string; courseModuleId?: string };

interface QuestionSnapshotEntry {
  questionId: string;
  points: number;
  optionOrder: string[];
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((v) => setB.has(v));
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isManualType(questionType: string): boolean {
  return MANUALLY_GRADED_QUESTION_TYPES.includes(questionType as (typeof MANUALLY_GRADED_QUESTION_TYPES)[number]);
}

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async findManageView(scope: AssessmentScope) {
    return this.prisma.assessment.findFirst({
      where: scope,
      include: {
        assessmentQuestions: {
          orderBy: { order: "asc" },
          include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
        },
      },
    });
  }

  async getLearnerSummary(scope: AssessmentScope, userId: string) {
    const assessment = await this.prisma.assessment.findFirst({ where: scope });
    if (!assessment) return null;

    const [questionCount, attempts] = await Promise.all([
      this.prisma.assessmentQuestion.count({ where: { assessmentId: assessment.id } }),
      this.prisma.assessmentAttempt.findMany({
        where: { assessmentId: assessment.id, userId },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    const completed = attempts.filter((a) => a.submittedAt);
    const graded = completed.filter(
      (a) => a.gradingStatus === "AUTO_GRADED" || a.gradingStatus === "MANUALLY_GRADED",
    );
    const inProgress = attempts.find((a) => !a.submittedAt);
    const mostRecentCompleted = completed[0];
    const awaitingGrading = Boolean(
      mostRecentCompleted &&
        (mostRecentCompleted.gradingStatus === "PENDING" ||
          mostRecentCompleted.gradingStatus === "PARTIALLY_GRADED"),
    );
    const bestScore = graded.length ? Math.max(...graded.map((a) => a.score ?? 0)) : null;
    const passed = graded.some((a) => a.passed);
    const attemptsUsed = attempts.length;
    const attemptsRemaining = assessment.maxAttempts
      ? Math.max(0, assessment.maxAttempts - attemptsUsed)
      : null;

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      assessmentKind: assessment.assessmentKind,
      passMarkPercent: assessment.passMarkPercent,
      maxAttempts: assessment.maxAttempts,
      timeLimitMinutes: assessment.timeLimitMinutes,
      questionCount: assessment.questionPoolSize
        ? Math.min(assessment.questionPoolSize, questionCount)
        : questionCount,
      attemptsUsed,
      attemptsRemaining,
      bestScore,
      passed,
      awaitingGrading,
      hasInProgressAttempt: Boolean(inProgress),
      inProgressAttemptId: inProgress?.id ?? null,
    };
  }

  async findAssessmentIdByScope(scope: AssessmentScope): Promise<string> {
    const assessment = await this.prisma.assessment.findFirst({ where: scope });
    if (!assessment) throw new NotFoundException("No assessment configured for this scope");
    return assessment.id;
  }

  async create(dto: CreateAssessmentDto, userId: string) {
    const hasLesson = Boolean(dto.lessonId);
    const hasModule = Boolean(dto.courseModuleId);
    if (hasLesson === hasModule) {
      throw new BadRequestException("Exactly one of lessonId or courseModuleId must be provided");
    }
    const scope: AssessmentScope = hasLesson ? { lessonId: dto.lessonId } : { courseModuleId: dto.courseModuleId };
    const existing = await this.prisma.assessment.findFirst({ where: scope });
    if (existing) {
      throw new ConflictException(
        hasLesson ? "This lesson already has a Knowledge Check" : "This module already has an assessment",
      );
    }

    return this.prisma.assessment.create({
      data: {
        lessonId: dto.lessonId,
        courseModuleId: dto.courseModuleId,
        title: dto.title,
        description: dto.description,
        assessmentKind: dto.assessmentKind ?? "ASSESSMENT",
        passMarkPercent: dto.passMarkPercent ?? 70,
        maxAttempts: dto.maxAttempts,
        timeLimitMinutes: dto.timeLimitMinutes,
        randomizeQuestions: dto.randomizeQuestions ?? false,
        randomizeAnswers: dto.randomizeAnswers ?? false,
        questionPoolSize: dto.questionPoolSize,
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
    const assessment = await this.findOrThrow(assessmentId);
    const question = await this.prisma.question.findUnique({ where: { id: dto.questionId } });
    if (!question) throw new NotFoundException("Question not found");

    const allowedTypes: readonly string[] =
      assessment.assessmentKind === "EXAM"
        ? [...GRADABLE_QUESTION_TYPES, ...MANUALLY_GRADED_QUESTION_TYPES]
        : GRADABLE_QUESTION_TYPES;
    if (!allowedTypes.includes(question.questionType)) {
      throw new BadRequestException(
        assessment.assessmentKind === "EXAM"
          ? "Only MCQ/True-False/Short Answer/Essay questions can be added to a Module Assessment"
          : "Only MCQ/True-False questions can be added to a Knowledge Check",
      );
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

  async startOrResumeAttempt(assessmentId: string, userId: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException("Assessment not found");

    let attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { assessmentId, userId, submittedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (!attempt) {
      const totalAttempts = await this.prisma.assessmentAttempt.count({
        where: { assessmentId, userId },
      });
      if (assessment.maxAttempts && totalAttempts >= assessment.maxAttempts) {
        throw new ForbiddenException("No attempts remaining for this assessment");
      }

      const pool = await this.prisma.assessmentQuestion.findMany({
        where: { assessmentId },
        orderBy: { order: "asc" },
        include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
      });
      if (pool.length === 0) throw new BadRequestException("This assessment has no questions yet");

      let selected = pool;
      if (assessment.questionPoolSize && assessment.questionPoolSize < pool.length) {
        selected = shuffle(pool).slice(0, assessment.questionPoolSize);
      }
      if (assessment.randomizeQuestions) {
        selected = shuffle(selected);
      }

      const questionSnapshot: QuestionSnapshotEntry[] = selected.map((aq) => ({
        questionId: aq.questionId,
        points: aq.pointsOverride ?? aq.question.points,
        optionOrder: assessment.randomizeAnswers
          ? shuffle(aq.question.options.map((o) => o.id))
          : aq.question.options.map((o) => o.id),
      }));

      attempt = await this.prisma.assessmentAttempt.create({
        data: {
          assessmentId,
          userId,
          attemptNumber: totalAttempts + 1,
          expiresAt: assessment.timeLimitMinutes
            ? new Date(Date.now() + assessment.timeLimitMinutes * 60000)
            : null,
          questionSnapshot: questionSnapshot as unknown as object,
        },
      });
    }

    return this.hydrateAttemptForLearner(attempt, assessment);
  }

  private async hydrateAttemptForLearner(attempt: AssessmentAttempt, assessment: Assessment) {
    const snapshot = (attempt.questionSnapshot ?? []) as unknown as QuestionSnapshotEntry[];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: snapshot.map((s) => s.questionId) } },
      include: { options: true },
    });
    const questionById = new Map(questions.map((q) => [q.id, q]));

    return {
      attemptId: attempt.id,
      expiresAt: attempt.expiresAt,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        passMarkPercent: assessment.passMarkPercent,
        timeLimitMinutes: assessment.timeLimitMinutes,
      },
      questions: snapshot
        .filter((s) => questionById.has(s.questionId))
        .map((s) => {
          const question = questionById.get(s.questionId)!;
          const optionById = new Map(question.options.map((o) => [o.id, o]));
          return {
            id: question.id,
            questionType: question.questionType,
            promptText: question.promptText,
            points: s.points,
            options: s.optionOrder
              .filter((oid) => optionById.has(oid))
              .map((oid) => {
                const o = optionById.get(oid)!;
                return { id: o.id, optionText: o.optionText };
              }),
          };
        }),
    };
  }

  async submitAttempt(attemptId: string, dto: SubmitAttemptDto, userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException("Attempt not found");
    if (attempt.submittedAt) throw new ConflictException("This attempt has already been submitted");

    const assessment = await this.prisma.assessment.findUniqueOrThrow({
      where: { id: attempt.assessmentId },
    });

    const snapshot = (attempt.questionSnapshot ?? []) as unknown as QuestionSnapshotEntry[];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: snapshot.map((s) => s.questionId) } },
      include: { options: true },
    });
    const questionById = new Map(questions.map((q) => [q.id, q]));

    let totalPossible = 0;
    let totalAwarded = 0;
    let hasManual = false;
    const perQuestion: {
      questionId: string;
      isCorrect: boolean | null;
      selectedOptionIds: string[];
      correctOptionIds: string[];
    }[] = [];
    const answerRows: {
      attemptId: string;
      questionId: string;
      responseData: object;
      isCorrect: boolean | null;
      pointsAwarded: number | null;
    }[] = [];

    for (const s of snapshot) {
      const question = questionById.get(s.questionId);
      if (!question) continue;
      totalPossible += s.points;
      const submitted = dto.answers.find((a) => a.questionId === s.questionId);

      if (isManualType(question.questionType)) {
        hasManual = true;
        answerRows.push({
          attemptId,
          questionId: s.questionId,
          responseData: { text: submitted?.responseText ?? "" },
          isCorrect: null,
          pointsAwarded: null,
        });
        perQuestion.push({
          questionId: s.questionId,
          isCorrect: null,
          selectedOptionIds: [],
          correctOptionIds: [],
        });
        continue;
      }

      const selectedOptionIds = submitted?.selectedOptionIds ?? [];
      const correctOptionIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
      const isCorrect = sameSet(selectedOptionIds, correctOptionIds);
      const pointsAwarded = isCorrect ? s.points : 0;
      totalAwarded += pointsAwarded;

      answerRows.push({
        attemptId,
        questionId: s.questionId,
        responseData: { selectedOptionIds },
        isCorrect,
        pointsAwarded,
      });
      perQuestion.push({ questionId: s.questionId, isCorrect, selectedOptionIds, correctOptionIds });
    }

    const gradingStatus: GradingStatus = hasManual ? "PENDING" : "AUTO_GRADED";
    const score = hasManual ? null : totalPossible > 0 ? (totalAwarded / totalPossible) * 100 : 0;
    const passed = hasManual ? null : score! >= assessment.passMarkPercent;

    await this.prisma.$transaction([
      this.prisma.assessmentAnswer.createMany({ data: answerRows }),
      this.prisma.assessmentAttempt.update({
        where: { id: attemptId },
        data: { submittedAt: new Date(), score, passed, gradingStatus },
      }),
    ]);

    return {
      gradingStatus,
      awaitingGrading: hasManual,
      score,
      passed,
      passMarkPercent: assessment.passMarkPercent,
      perQuestion,
    };
  }

  async listPendingGrading() {
    return this.prisma.assessmentAttempt.findMany({
      where: { submittedAt: { not: null }, gradingStatus: { in: ["PENDING", "PARTIALLY_GRADED"] } },
      include: {
        assessment: { select: { id: true, title: true, assessmentKind: true, lessonId: true, courseModuleId: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { submittedAt: "asc" },
    });
  }

  async getAttemptForGrading(attemptId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        answers: { include: { question: { include: { options: true } } } },
      },
    });
    if (!attempt) throw new NotFoundException("Attempt not found");
    return attempt;
  }

  async gradeAnswer(attemptId: string, answerId: string, dto: GradeAnswerDto, graderId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException("Attempt not found");
    if (!attempt.submittedAt) throw new BadRequestException("This attempt has not been submitted yet");
    if (attempt.gradingStatus === "MANUALLY_GRADED") {
      throw new ConflictException("This attempt has already been finalized");
    }

    const answer = await this.prisma.assessmentAnswer.findUnique({ where: { id: answerId } });
    if (!answer || answer.attemptId !== attemptId) throw new NotFoundException("Answer not found");

    await this.prisma.$transaction([
      this.prisma.assessmentAnswer.update({
        where: { id: answerId },
        data: { pointsAwarded: dto.pointsAwarded, feedback: dto.feedback, gradedById: graderId },
      }),
      this.prisma.assessmentAttempt.update({
        where: { id: attemptId },
        data: { gradingStatus: "PARTIALLY_GRADED" },
      }),
    ]);

    return { success: true };
  }

  async finalizeAttempt(attemptId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException("Attempt not found");
    if (!attempt.submittedAt) throw new BadRequestException("This attempt has not been submitted yet");
    if (attempt.gradingStatus === "MANUALLY_GRADED") {
      throw new ConflictException("This attempt has already been finalized");
    }

    const assessment = await this.prisma.assessment.findUniqueOrThrow({
      where: { id: attempt.assessmentId },
    });
    const snapshot = (attempt.questionSnapshot ?? []) as unknown as QuestionSnapshotEntry[];
    const answers = await this.prisma.assessmentAnswer.findMany({ where: { attemptId } });

    const ungraded = answers.find((a) => a.pointsAwarded === null);
    if (ungraded) {
      throw new BadRequestException("All manually-graded answers must be scored before finalizing");
    }

    const totalPossible = snapshot.reduce((sum, s) => sum + s.points, 0);
    const totalAwarded = answers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);
    const score = totalPossible > 0 ? (totalAwarded / totalPossible) * 100 : 0;
    const passed = score >= assessment.passMarkPercent;

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { score, passed, gradingStatus: "MANUALLY_GRADED" },
    });

    return { score, passed };
  }

  private async findOrThrow(id: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException("Assessment not found");
    return assessment;
  }
}
