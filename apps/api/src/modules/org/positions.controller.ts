import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { PositionsService } from "./positions.service";
import { CreatePositionDto } from "./dto/create-position.dto";

@Controller("positions")
export class PositionsController {
  constructor(private positionsService: PositionsService) {}

  @Get()
  @RequirePermissions("position.read")
  findAll() {
    return this.positionsService.findAll();
  }

  @Post()
  @RequirePermissions("position.create")
  create(@Body() dto: CreatePositionDto) {
    return this.positionsService.create(dto);
  }

  @Delete(":id")
  @RequirePermissions("position.delete")
  async delete(@Param("id") id: string) {
    await this.positionsService.delete(id);
    return { success: true };
  }
}
