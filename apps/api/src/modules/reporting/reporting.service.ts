import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  async getPatientReporting(practitionerId: string, patientId: string, orgId: string) {
    // Verify patient belongs to same org
    const patient = await this.prisma.user.findFirst({
      where: { id: patientId, organizationId: orgId, role: 'PATIENT' },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found in your organization');
    }

    // Get all assignments for this patient by this practitioner
    const assignments = await this.prisma.assignment.findMany({
      where: { patientId, practitionerId },
      include: {
        activity: { select: { key: true, name: true, category: true } },
        sessions: {
          include: { metrics: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Flatten all sessions
    const allSessions = assignments.flatMap((a) =>
      a.sessions.map((s) => ({
        ...s,
        activity: a.activity,
        assignmentConfig: a.config,
      })),
    );

    // Calculate summary
    const totalSessions = allSessions.length;
    const scores = allSessions
      .flatMap((s) => s.metrics)
      .filter((m) => m.key === 'score')
      .map((m) => m.value);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const lastSessionDate = allSessions.length > 0 ? allSessions[0].createdAt : null;

    return {
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
      },
      assignments: assignments.map((a) => ({
        id: a.id,
        activity: a.activity,
        config: a.config,
        sessionCount: a.sessions.length,
        lastSessionDate: a.sessions.length > 0 ? a.sessions[0].createdAt : null,
      })),
      sessions: allSessions.slice(0, 50), // Last 50 sessions
      summary: {
        totalSessions,
        averageScore,
        lastSessionDate,
      },
    };
  }

  async getOrgReporting(orgId: string) {
    const totalPatients = await this.prisma.user.count({
      where: { organizationId: orgId, role: 'PATIENT' },
    });

    const totalPractitioners = await this.prisma.user.count({
      where: { organizationId: orgId, role: 'PRACTITIONER' },
    });

    const totalAssignments = await this.prisma.assignment.count({
      where: { patient: { organizationId: orgId } },
    });

    const totalSessions = await this.prisma.session.count({
      where: { assignment: { patient: { organizationId: orgId } } },
    });

    // Activity usage breakdown
    const activityUsage = await this.prisma.assignment.groupBy({
      by: ['activityId'],
      where: { patient: { organizationId: orgId } },
      _count: true,
    });

    const activityDetails = await Promise.all(
      activityUsage.map(async (a) => {
        const activity = await this.prisma.activity.findUnique({
          where: { id: a.activityId },
          select: { key: true, name: true, category: true },
        });
        return { ...activity, assignmentCount: a._count };
      }),
    );

    return {
      totalPatients,
      totalPractitioners,
      totalAssignments,
      totalSessions,
      activityUsage: activityDetails,
    };
  }
}
