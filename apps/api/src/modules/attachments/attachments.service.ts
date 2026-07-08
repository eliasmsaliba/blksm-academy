import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import { AttachableType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { STORAGE_DRIVER, StorageDriver } from "./storage/storage-driver.interface";

@Injectable()
export class AttachmentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_DRIVER) private storage: StorageDriver,
  ) {}

  findForEntity(attachableType: AttachableType, attachableId: string) {
    return this.prisma.attachment.findMany({
      where: { attachableType, attachableId },
      orderBy: { createdAt: "desc" },
    });
  }

  async upload(
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    attachableType: AttachableType,
    attachableId: string,
    uploadedById: string,
  ) {
    const storageKey = `${attachableType.toLowerCase()}/${attachableId}/${randomUUID()}-${file.originalname}`;
    await this.storage.save(storageKey, file.buffer);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");

    return this.prisma.attachment.create({
      data: {
        attachableType,
        attachableId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        checksum,
        uploadedById,
      },
    });
  }

  async findOne(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException("Attachment not found");
    return attachment;
  }

  async download(id: string) {
    const attachment = await this.findOne(id);
    const buffer = await this.storage.read(attachment.storageKey);
    return { attachment, buffer };
  }

  async delete(id: string) {
    const attachment = await this.findOne(id);
    await this.storage.delete(attachment.storageKey);
    await this.prisma.attachment.delete({ where: { id } });
  }
}
