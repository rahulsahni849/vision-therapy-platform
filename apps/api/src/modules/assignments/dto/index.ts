import { IsUUID, IsObject, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  activityId: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
