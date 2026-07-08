import { IsEnum, IsString } from "class-validator";
import { EnrollableType } from "@prisma/client";

export class CreateSelfEnrollmentDto {
  @IsEnum(EnrollableType)
  enrollableType!: EnrollableType;

  @IsString()
  enrollableId!: string;
}
