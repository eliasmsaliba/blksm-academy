import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import type { Prisma } from "@prisma/client";

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  findByModule(courseModuleId: string) {
    return this.prisma.lesson.findMany({
      where: { courseModuleId },
      orderBy: { order: "asc" },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException("Lesson not found");
    return lesson;
  }

  create(dto: CreateLessonDto) {
    return this.prisma.lesson.create({
      data: { ...dto, content: dto.content as Prisma.InputJsonValue },
    });
  }

  async update(id: string, dto: UpdateLessonDto) {
    await this.findOne(id);
    return this.prisma.lesson.update({
      where: { id },
      data: { ...dto, content: dto.content as Prisma.InputJsonValue | undefined },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.lesson.delete({ where: { id } });
  }
}
