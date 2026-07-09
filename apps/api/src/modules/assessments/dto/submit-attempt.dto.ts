import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsString, ValidateNested } from "class-validator";

export class SubmittedAnswerDto {
  @IsString()
  questionId!: string;

  @IsArray()
  @IsString({ each: true })
  selectedOptionIds!: string[];
}

export class SubmitAttemptDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers!: SubmittedAnswerDto[];
}
