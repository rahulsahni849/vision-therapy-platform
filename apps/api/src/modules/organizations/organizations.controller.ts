import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ToggleActivityDto } from './dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get('me')
  @Roles('ADMIN', 'PRACTITIONER', 'PATIENT')
  async getMyOrganization(@Request() req: any) {
    return this.organizationsService.findById(req.user.orgId);
  }

  @Get('users')
  @Roles('ADMIN')
  async getOrgUsers(@Request() req: any) {
    return this.organizationsService.getOrgUsers(req.user.orgId);
  }

  @Get('activities')
  @Roles('ADMIN', 'PRACTITIONER')
  async getOrgActivities(@Request() req: any) {
    return this.organizationsService.getOrgActivities(req.user.orgId);
  }

  @Patch('activities/:activityId')
  @Roles('ADMIN')
  async toggleActivity(
    @Request() req: any,
    @Param('activityId') activityId: string,
    @Body() toggleDto: ToggleActivityDto,
  ) {
    return this.organizationsService.toggleActivity(
      req.user.orgId,
      activityId,
      toggleDto.isEnabled,
    );
  }
}
