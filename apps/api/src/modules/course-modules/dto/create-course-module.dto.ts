import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { ContentStatus } from "@prisma/client";

export class CreateCourseModuleDto {
  @IsString()
  courseId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  learningOutcomes?: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourcesRequired?: string[];

  @IsOptional()
  @IsInt()
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
