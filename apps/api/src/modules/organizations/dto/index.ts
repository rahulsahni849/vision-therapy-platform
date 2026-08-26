import { IsBoolean, IsString, IsOptional, IsIn } from 'class-validator';

export class ToggleActivityDto {
  @IsBoolean()
  isEnabled: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRACTITIONER', 'PATIENT'])
  role?: string;
}
