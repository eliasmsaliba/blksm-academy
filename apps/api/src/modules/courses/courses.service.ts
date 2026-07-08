import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import type { RequestUser } from "../../common/types/request-user";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  findByAcademy(academyId: string) {
    return this.prisma.course.findMany({
      where: { academyId },
      orderBy: { order: "asc" },
      include: { _count: { select: { modules: true } } },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { modules: { orderBy: { order: "asc" } }, academy: true },
    });
    if (!course) throw new NotFoundException("Course not found");
    return course;
  }

  async create(dto: CreateCourseDto, actor: RequestUser) {
    const existing = await this.prisma.course.findUnique({
      where: { academyId_slug: { academyId: dto.academyId, slug: dto.slug } },
    });
    if (existing) throw new ConflictException("A course with this slug already exists in this academy");
    return this.prisma.course.create({ data: { ...dto, createdById: actor.id } });
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.course.delete({ where: { id } });
  }
}
