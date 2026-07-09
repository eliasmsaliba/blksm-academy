import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GradeAnswerDto {
  @IsNumber()
  @Min(0)
  pointsAwarded!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
