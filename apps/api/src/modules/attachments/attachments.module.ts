import { Module } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";
import { AttachmentsController } from "./attachments.controller";
import { STORAGE_DRIVER } from "./storage/storage-driver.interface";
import { LocalStorageDriver } from "./storage/local-storage.driver";

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService, { provide: STORAGE_DRIVER, useClass: LocalStorageDriver }],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
