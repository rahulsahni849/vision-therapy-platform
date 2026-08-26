import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSessionDto } from './dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @Roles('PATIENT')
  async createSession(@Request() req: any, @Body() createDto: CreateSessionDto) {
    return this.sessionsService.createSession(
      req.user.userId,
      createDto.assignmentId,
      createDto.startedAt,
      createDto.endedAt,
      createDto.rawResult,
    );
  }

  @Get(':id')
  @Roles('PRACTITIONER', 'PATIENT')
  async getSessionById(@Param('id') id: string) {
    return this.sessionsService.getSessionById(id);
  }

  @Get('assignment/:assignmentId')
  @Roles('PRACTITIONER', 'PATIENT')
  async getSessionsByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.sessionsService.getSessionsByAssignment(assignmentId);
  }
}
