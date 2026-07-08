import { IsEnum, IsOptional, IsString } from "class-validator";
import { ContentStatus } from "@prisma/client";

export class CreateAcademyDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
