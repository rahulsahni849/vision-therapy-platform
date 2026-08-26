import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @Roles('ADMIN', 'PRACTITIONER', 'PATIENT')
  async getAllActivities(@Request() req: any) {
    if (req.user.role === 'PATIENT') {
      return this.activitiesService.getEnabledActivitiesForOrg(req.user.orgId);
    }
    return this.activitiesService.getAllActivities();
  }

  @Get(':key')
  @Roles('ADMIN', 'PRACTITIONER')
  async getActivityByKey(@Param('key') key: string) {
    return this.activitiesService.getActivityByKey(key);
  }

  @Post('seed')
  @Roles('ADMIN')
  async seedActivities() {
    return this.activitiesService.seedActivities();
  }
}
