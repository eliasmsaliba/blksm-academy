import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateQuestionOptionDto {
  @IsString()
  optionText!: string;

  @IsBoolean()
  isCorrect!: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
