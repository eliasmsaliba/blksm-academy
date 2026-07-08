import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePositionDto } from "./dto/create-position.dto";

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.position.findMany({ include: { department: true }, orderBy: { title: "asc" } });
  }

  async findOne(id: string) {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!position) throw new NotFoundException("Position not found");
    return position;
  }

  create(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.position.delete({ where: { id } });
  }
}
