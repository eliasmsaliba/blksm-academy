import { IsEnum, IsInt, IsObject, IsOptional, IsString } from "class-validator";
import { ContentStatus, LessonType } from "@prisma/client";

export class CreateLessonDto {
  @IsString()
  courseModuleId!: string;

  @IsString()
  title!: string;

  @IsEnum(LessonType)
  lessonType!: LessonType;

  @IsObject()
  content!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
