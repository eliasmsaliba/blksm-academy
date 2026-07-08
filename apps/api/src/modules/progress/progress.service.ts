import { Injectable, NotFoundException } from "@nestjs/common";
import { ProgressStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateLessonProgressDto } from "./dto/update-lesson-progress.dto";

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getLessonProgressForUser(userId: string, courseModuleId: string) {
    return this.prisma.lessonProgress.findMany({
      where: { userId, lesson: { courseModuleId } },
    });
  }

  async getCourseProgress(userId: string, courseId: string) {
    return this.prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  async setLessonProgress(userId: string, lessonId: string, dto: UpdateLessonProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { courseModule: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    const completedAt = dto.status === ProgressStatus.COMPLETED ? new Date() : null;

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: dto.status,
        timeSpentSeconds: dto.timeSpentSeconds ?? 0,
        completedAt: completedAt ?? undefined,
      },
      update: {
        status: dto.status,
        timeSpentSeconds: dto.timeSpentSeconds
          ? { increment: dto.timeSpentSeconds }
          : undefined,
        lastAccessedAt: new Date(),
        completedAt: completedAt ?? undefined,
      },
    });

    return this.recomputeCourseProgress(userId, lesson.courseModule.courseId);
  }

  private async recomputeCourseProgress(userId: string, courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseModule: { courseId } },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);
    const total = lessonIds.length;

    const completedCount = total
      ? await this.prisma.lessonProgress.count({
          where: {
            userId,
            lessonId: { in: lessonIds },
            status: ProgressStatus.COMPLETED,
          },
        })
      : 0;

    const percentComplete = total ? (completedCount / total) * 100 : 0;
    const status =
      percentComplete >= 100
        ? ProgressStatus.COMPLETED
        : percentComplete > 0
          ? ProgressStatus.IN_PROGRESS
          : ProgressStatus.NOT_STARTED;

    return this.prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        percentComplete,
        status,
        startedAt: percentComplete > 0 ? new Date() : undefined,
        completedAt: status === ProgressStatus.COMPLETED ? new Date() : undefined,
      },
      update: {
        percentComplete,
        status,
        completedAt: status === ProgressStatus.COMPLETED ? new Date() : null,
      },
    });
  }
}
