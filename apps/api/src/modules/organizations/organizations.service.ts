import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async create(name: string) {
    return this.prisma.organization.create({ data: { name } });
  }

  async update(id: string, name: string) {
    return this.prisma.organization.update({ where: { id }, data: { name } });
  }

  async getOrgUsers(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async getOrgActivities(orgId: string) {
    return this.prisma.orgActivity.findMany({
      where: { organizationId: orgId },
      include: { activity: true },
    });
  }

  async toggleActivity(orgId: string, activityId: string, isEnabled: boolean) {
    return this.prisma.orgActivity.upsert({
      where: {
        organizationId_activityId: { organizationId: orgId, activityId },
      },
      update: { isEnabled },
      create: { organizationId: orgId, activityId, isEnabled },
    });
  }
}
