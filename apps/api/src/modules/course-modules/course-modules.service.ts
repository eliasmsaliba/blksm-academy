import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCourseModuleDto } from "./dto/create-course-module.dto";
import { UpdateCourseModuleDto } from "./dto/update-course-module.dto";

@Injectable()
export class CourseModulesService {
  constructor(private prisma: PrismaService) {}

  findByCourse(courseId: string) {
    return this.prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: { _count: { select: { lessons: true } } },
    });
  }

  async findOne(id: string) {
    const courseModule = await this.prisma.courseModule.findUnique({
      where: { id },
      include: { lessons: { orderBy: { order: "asc" } } },
    });
    if (!courseModule) throw new NotFoundException("Module not found");
    return courseModule;
  }

  create(dto: CreateCourseModuleDto) {
    return this.prisma.courseModule.create({ data: dto });
  }

  async update(id: string, dto: UpdateCourseModuleDto) {
    await this.findOne(id);
    return this.prisma.courseModule.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.courseModule.delete({ where: { id } });
  }
}
