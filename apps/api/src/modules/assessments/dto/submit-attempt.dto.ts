import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from "class-validator";

export class SubmittedAnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  @IsOptional()
  @IsString()
  responseText?: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers!: SubmittedAnswerDto[];
}
