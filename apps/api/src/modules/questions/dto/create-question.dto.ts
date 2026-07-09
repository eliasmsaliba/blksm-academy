import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { QuestionType } from "@prisma/client";
import { CreateQuestionOptionDto } from "./create-question-option.dto";

export const GRADABLE_QUESTION_TYPES = [
  QuestionType.MCQ_SINGLE,
  QuestionType.MCQ_MULTI,
  QuestionType.TRUE_FALSE,
] as const;

/** Open-ended types that require a human (Assessor) to score — no options, optional grading guidance. */
export const MANUALLY_GRADED_QUESTION_TYPES = [QuestionType.SHORT_ANSWER, QuestionType.ESSAY] as const;

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @IsString()
  promptText!: string;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsString()
  gradingGuidance?: string;

  @ValidateIf((o) => !MANUALLY_GRADED_QUESTION_TYPES.includes(o.questionType))
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}
