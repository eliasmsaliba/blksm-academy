import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { EnrollmentService } from "./enrollment.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { CreateSelfEnrollmentDto } from "./dto/create-self-enrollment.dto";

@Controller("enrollments")
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  @Get("me")
  findMine(@CurrentUser() user: RequestUser) {
    return this.enrollmentService.findForUser(user.id);
  }

  @Get("user/:userId")
  @RequirePermissions("enrollment.read")
  findForUser(@Param("userId") userId: string) {
    return this.enrollmentService.findForUser(userId);
  }

  /** Any authenticated user may self-enroll in a published course from the catalogue. */
  @Post("me")
  createMine(@Body() dto: CreateSelfEnrollmentDto, @CurrentUser() user: RequestUser) {
    return this.enrollmentService.create({ ...dto, userId: user.id }, user);
  }

  /** Admin-assigned enrollment on behalf of another user. */
  @Post()
  @RequirePermissions("enrollment.create")
  create(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: RequestUser) {
    return this.enrollmentService.create(dto, user);
  }

  @Delete(":id")
  @RequirePermissions("enrollment.delete")
  async delete(@Param("id") id: string) {
    await this.enrollmentService.delete(id);
    return { success: true };
  }
}
