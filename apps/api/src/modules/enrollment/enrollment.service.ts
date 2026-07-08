import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import type { RequestUser } from "../../common/types/request-user";

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  findForUser(userId: string) {
    return this.prisma.enrollment.findMany({ where: { userId }, orderBy: { enrolledAt: "desc" } });
  }

  create(dto: CreateEnrollmentDto, actor: RequestUser) {
    return this.prisma.enrollment.upsert({
      where: {
        userId_enrollableType_enrollableId: {
          userId: dto.userId,
          enrollableType: dto.enrollableType,
          enrollableId: dto.enrollableId,
        },
      },
      create: {
        userId: dto.userId,
        enrollableType: dto.enrollableType,
        enrollableId: dto.enrollableId,
        enrolledById: actor.id,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      update: {},
    });
  }

  async delete(id: string) {
    await this.prisma.enrollment.delete({ where: { id } });
  }
}
