import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePublicSubmissionDto {
  @IsString()
  clientId!: string;

  @IsString()
  @MinLength(2)
  requesterName!: string;

  @IsEmail()
  requesterEmail!: string;

  @IsString()
  @MinLength(3)
  subject!: string;

  @IsString()
  @MinLength(10)
  description!: string;
}

export class ConvertPublicSubmissionDto {
  @IsOptional()
  @IsString()
  priority?: string;
}
