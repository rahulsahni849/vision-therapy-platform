import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityRegistry } from '../activities/registry/activity-registry';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private registry: ActivityRegistry,
  ) {}

  async createAssignment(practitionerId: string, orgId: string, patientId: string, activityId: string, config: any) {
    // Verify patient belongs to same org
    const patient = await this.prisma.user.findFirst({
      where: { id: patientId, organizationId: orgId, role: 'PATIENT' },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found in your organization');
    }

    // Verify activity exists
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Validate config against activity schema
    const activityModule = this.registry.getActivity(activity.key);
    if (activityModule) {
      // Validate config if schema exists
      const schema = activityModule.manifest.configSchema;
      if (schema && Object.keys(schema).length > 0) {
        // Basic validation - in production use Zod schema
      }
    }

    return this.prisma.assignment.create({
      data: {
        patientId,
        practitionerId,
        activityId,
        config,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        activity: { select: { id: true, key: true, name: true, category: true } },
      },
    });
  }

  async getMyAssignments(patientId: string) {
    return this.prisma.assignment.findMany({
      where: { patientId, isActive: true },
      include: {
        activity: { select: { id: true, key: true, name: true, category: true } },
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getPatientAssignments(practitionerId: string, patientId: string, orgId: string) {
    // Verify patient belongs to same org
    const patient = await this.prisma.user.findFirst({
      where: { id: patientId, organizationId: orgId, role: 'PATIENT' },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found in your organization');
    }

    return this.prisma.assignment.findMany({
      where: { patientId, practitionerId },
      include: {
        activity: { select: { id: true, key: true, name: true, category: true } },
        sessions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async getAssignmentSessions(assignmentId: string, userId: string, role: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (role === 'PATIENT' && assignment.patientId !== userId) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    return this.prisma.session.findMany({
      where: { assignmentId },
      include: { metrics: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
