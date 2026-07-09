import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateAssessmentDto {
  @IsString()
  lessonId!: string;

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
}
