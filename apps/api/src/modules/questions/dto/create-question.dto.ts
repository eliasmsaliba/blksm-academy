import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";
import { QuestionType } from "@prisma/client";
import { CreateQuestionOptionDto } from "./create-question-option.dto";

export const GRADABLE_QUESTION_TYPES = [
  QuestionType.MCQ_SINGLE,
  QuestionType.MCQ_MULTI,
  QuestionType.TRUE_FALSE,
] as const;

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @IsString()
  promptText!: string;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options!: CreateQuestionOptionDto[];
}
