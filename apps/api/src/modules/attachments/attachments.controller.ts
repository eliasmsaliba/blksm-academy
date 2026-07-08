import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { AttachableType } from "@prisma/client";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AttachmentsService } from "./attachments.service";

@Controller("attachments")
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Get()
  @RequirePermissions("attachment.read")
  findForEntity(
    @Query("attachableType") attachableType: AttachableType,
    @Query("attachableId") attachableId: string,
  ) {
    return this.attachmentsService.findForEntity(attachableType, attachableId);
  }

  @Post()
  @RequirePermissions("attachment.create")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body("attachableType") attachableType: AttachableType,
    @Body("attachableId") attachableId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.attachmentsService.upload(file, attachableType, attachableId, user.id);
  }

  @Get(":id/download")
  @RequirePermissions("attachment.read")
  async download(@Param("id") id: string, @Res() res: Response) {
    const { attachment, buffer } = await this.attachmentsService.download(id);
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
    res.send(buffer);
  }

  @Delete(":id")
  @RequirePermissions("attachment.delete")
  async delete(@Param("id") id: string) {
    await this.attachmentsService.delete(id);
    return { success: true };
  }
}
