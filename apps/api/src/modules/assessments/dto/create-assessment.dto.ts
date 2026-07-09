import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { AssessmentKind } from "@prisma/client";

export class CreateAssessmentDto {
  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsString()
  courseModuleId?: string;

  @IsOptional()
  @IsEnum(AssessmentKind)
  assessmentKind?: AssessmentKind;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Min(0)
  @Max(100)
  passMarkPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number;

  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  randomizeAnswers?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  questionPoolSize?: number;
}
