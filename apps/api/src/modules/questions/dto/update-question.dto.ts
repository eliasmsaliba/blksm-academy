import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsOptional } from "class-validator";
import { CreateQuestionDto } from "./create-question.dto";

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
