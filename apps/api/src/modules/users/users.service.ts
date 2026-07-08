import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AuthProviderType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const userInclude = {
  userRoles: { include: { role: true } },
  employeeProfile: { include: { department: true, position: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      include: userInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("A user with this email already exists");

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        authIdentities: {
          create: { provider: AuthProviderType.LOCAL, passwordHash },
        },
        employeeProfile:
          dto.departmentId || dto.positionId
            ? { create: { departmentId: dto.departmentId, positionId: dto.positionId } }
            : undefined,
        userRoles: dto.roleIds?.length
          ? { create: dto.roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: userInclude,
    });
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { departmentId, positionId, ...userFields } = dto;

    if (departmentId !== undefined || positionId !== undefined) {
      await this.prisma.employeeProfile.upsert({
        where: { userId: id },
        create: { userId: id, departmentId, positionId },
        update: { departmentId, positionId },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: userFields,
      include: userInclude,
    });
  }

  async assignRole(userId: string, roleId: string) {
    await this.findOne(userId);
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId, scopeType: "GLOBAL", scopeId: null },
    });
    if (!existing) {
      await this.prisma.userRole.create({ data: { userId, roleId } });
    }
    return this.findOne(userId);
  }

  async revokeRole(userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return this.findOne(userId);
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
