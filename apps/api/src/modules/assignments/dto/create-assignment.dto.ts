import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateAssignmentDto {
  @IsString()
  courseModuleId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPoints?: number;

  @IsOptional()
  @IsString()
  rubric?: string;
}
