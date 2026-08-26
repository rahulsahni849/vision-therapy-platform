import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get('patient/:patientId')
  @Roles('PRACTITIONER')
  async getPatientReporting(@Request() req: any, @Param('patientId') patientId: string) {
    return this.reportingService.getPatientReporting(
      req.user.userId,
      patientId,
      req.user.orgId,
    );
  }

  @Get('org')
  @Roles('ADMIN')
  async getOrgReporting(@Request() req: any) {
    return this.reportingService.getOrgReporting(req.user.orgId);
  }
}
