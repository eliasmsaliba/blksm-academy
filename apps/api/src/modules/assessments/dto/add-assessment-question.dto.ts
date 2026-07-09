import { IsInt, IsOptional, IsString } from "class-validator";

export class AddAssessmentQuestionDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsInt()
  pointsOverride?: number;
}
