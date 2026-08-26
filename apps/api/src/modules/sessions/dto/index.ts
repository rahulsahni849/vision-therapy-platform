import { IsUUID, IsString, IsObject, IsOptional, IsDateString } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  assignmentId: string;

  @IsDateString()
  startedAt: string;

  @IsDateString()
  @IsOptional()
  endedAt?: string;

  @IsObject()
  rawResult: Record<string, any>;
}
