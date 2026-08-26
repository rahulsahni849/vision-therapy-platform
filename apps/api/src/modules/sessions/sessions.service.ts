import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityRegistry } from '../activities/registry/activity-registry';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private registry: ActivityRegistry,
  ) {}

  async createSession(patientId: string, assignmentId: string, startedAt: string, endedAt: string | null | undefined, rawResult: any) {
    // Verify assignment belongs to patient
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { activity: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.patientId !== patientId) {
      throw new ForbiddenException('You can only submit sessions for your own assignments');
    }

    // Create session with raw result
    const session = await this.prisma.session.create({
      data: {
        assignmentId,
        startedAt: new Date(startedAt),
        endedAt: endedAt ? new Date(endedAt) : null,
        rawResult,
      },
    });

    // Score session using activity registry
    try {
      const metrics = this.registry.scoreSession(assignment.activity.key, rawResult);
      if (metrics.length > 0) {
        await this.prisma.sessionMetric.createMany({
          data: metrics.map((m) => ({
            sessionId: session.id,
            key: m.key,
            value: m.value,
          })),
        });
      }
    } catch (error) {
      console.error('Error scoring session:', error);
    }

    return this.prisma.session.findUnique({
      where: { id: session.id },
      include: { metrics: true },
    });
  }

  async getSessionById(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { metrics: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async getSessionsByAssignment(assignmentId: string) {
    return this.prisma.session.findMany({
      where: { assignmentId },
      include: { metrics: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
