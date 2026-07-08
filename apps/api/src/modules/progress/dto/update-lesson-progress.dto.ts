import { IsEnum, IsInt, IsOptional } from "class-validator";
import { ProgressStatus } from "@prisma/client";

export class UpdateLessonProgressDto {
  @IsEnum(ProgressStatus)
  status!: ProgressStatus;

  @IsOptional()
  @IsInt()
  timeSpentSeconds?: number;
}
