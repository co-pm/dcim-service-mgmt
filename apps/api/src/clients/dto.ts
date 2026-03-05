import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE"])
  status?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE"])
  status?: string;
}
