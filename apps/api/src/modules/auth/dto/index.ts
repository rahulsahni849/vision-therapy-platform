import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class SetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEnum(['PRACTITIONER', 'PATIENT'])
  role: 'PRACTITIONER' | 'PATIENT';
}

export class RefreshTokenDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
