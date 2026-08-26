import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ToggleActivityDto, UpdateUserDto } from './dto';

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

  @Patch('users/:userId')
  @Roles('ADMIN')
  async updateUser(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.organizationsService.updateUser(req.user.orgId, userId, updateDto);
  }

  @Patch('users/:userId/toggle-active')
  @Roles('ADMIN')
  async toggleUserActive(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.toggleUserActive(req.user.orgId, userId);
  }

  @Delete('users/:userId')
  @Roles('ADMIN')
  async deleteUser(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.deleteUser(req.user.orgId, userId);
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
