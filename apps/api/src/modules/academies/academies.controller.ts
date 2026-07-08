import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AcademiesService } from "./academies.service";
import { CreateAcademyDto } from "./dto/create-academy.dto";
import { UpdateAcademyDto } from "./dto/update-academy.dto";

@Controller("academies")
export class AcademiesController {
  constructor(private academiesService: AcademiesService) {}

  @Get()
  @RequirePermissions("academy.read")
  findAll() {
    return this.academiesService.findAll();
  }

  @Get(":id")
  @RequirePermissions("academy.read")
  findOne(@Param("id") id: string) {
    return this.academiesService.findOne(id);
  }

  @Post()
  @RequirePermissions("academy.create")
  create(@Body() dto: CreateAcademyDto, @CurrentUser() user: RequestUser) {
    return this.academiesService.create(dto, user);
  }

  @Patch(":id")
  @RequirePermissions("academy.update")
  update(@Param("id") id: string, @Body() dto: UpdateAcademyDto) {
    return this.academiesService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("academy.delete")
  async delete(@Param("id") id: string) {
    await this.academiesService.delete(id);
    return { success: true };
  }
}
