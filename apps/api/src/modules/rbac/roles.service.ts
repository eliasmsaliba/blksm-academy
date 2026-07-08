import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionKeys
          ? {
              create: await this.permissionKeysToRows(dto.permissionKeys),
            }
          : undefined,
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async setPermissions(roleId: string, permissionKeys: string[]) {
    await this.findOne(roleId);
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: (await this.permissionKeysToRows(permissionKeys)).map((row) => ({
        roleId,
        permissionId: row.permissionId,
      })),
    });
    return this.findOne(roleId);
  }

  async delete(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new NotFoundException("System roles cannot be deleted");
    }
    await this.prisma.role.delete({ where: { id } });
  }

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] });
  }

  private async permissionKeysToRows(keys: string[]) {
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
    });
    return permissions.map((p) => ({ permissionId: p.id }));
  }
}
