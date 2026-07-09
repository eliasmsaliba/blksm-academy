import { PartialType, OmitType } from "@nestjs/mapped-types";
import { CreateAssessmentDto } from "./create-assessment.dto";

export class UpdateAssessmentDto extends PartialType(
  OmitType(CreateAssessmentDto, ["lessonId"] as const),
) {}
