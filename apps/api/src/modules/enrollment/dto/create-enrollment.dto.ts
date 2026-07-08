import { IsEnum, IsOptional, IsString } from "class-validator";
import { EnrollableType } from "@prisma/client";

export class CreateEnrollmentDto {
  @IsString()
  userId!: string;

  @IsEnum(EnrollableType)
  enrollableType!: EnrollableType;

  @IsString()
  enrollableId!: string;

  @IsOptional()
  dueDate?: string;
}
