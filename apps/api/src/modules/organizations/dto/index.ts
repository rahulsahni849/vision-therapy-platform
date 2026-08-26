import { IsBoolean } from 'class-validator';

export class ToggleActivityDto {
  @IsBoolean()
  isEnabled: boolean;
}
