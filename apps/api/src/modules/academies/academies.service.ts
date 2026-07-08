import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAcademyDto } from "./dto/create-academy.dto";
import { UpdateAcademyDto } from "./dto/update-academy.dto";
import type { RequestUser } from "../../common/types/request-user";

@Injectable()
export class AcademiesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.academy.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const academy = await this.prisma.academy.findUnique({
      where: { id },
      include: {
        courses: { orderBy: { order: "asc" } },
      },
    });
    if (!academy) throw new NotFoundException("Academy not found");
    return academy;
  }

  async create(dto: CreateAcademyDto, actor: RequestUser) {
    const existing = await this.prisma.academy.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException("An academy with this slug already exists");
    return this.prisma.academy.create({ data: { ...dto, createdById: actor.id } });
  }

  async update(id: string, dto: UpdateAcademyDto) {
    await this.findOne(id);
    return this.prisma.academy.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.academy.delete({ where: { id } });
  }
}
