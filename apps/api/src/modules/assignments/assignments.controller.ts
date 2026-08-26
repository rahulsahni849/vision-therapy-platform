import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAssignmentDto } from './dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Post()
  @Roles('PRACTITIONER')
  async createAssignment(@Request() req: any, @Body() createDto: CreateAssignmentDto) {
    return this.assignmentsService.createAssignment(
      req.user.userId,
      req.user.orgId,
      createDto.patientId,
      createDto.activityId,
      createDto.config,
    );
  }

  @Get('mine')
  @Roles('PATIENT')
  async getMyAssignments(@Request() req: any) {
    return this.assignmentsService.getMyAssignments(req.user.userId);
  }

  @Get('patient/:patientId')
  @Roles('PRACTITIONER')
  async getPatientAssignments(@Request() req: any, @Param('patientId') patientId: string) {
    return this.assignmentsService.getPatientAssignments(
      req.user.userId,
      patientId,
      req.user.orgId,
    );
  }

  @Get(':id/sessions')
  @Roles('PRACTITIONER', 'PATIENT')
  async getAssignmentSessions(@Request() req: any, @Param('id') id: string) {
    return this.assignmentsService.getAssignmentSessions(id, req.user.userId, req.user.role);
  }
}
