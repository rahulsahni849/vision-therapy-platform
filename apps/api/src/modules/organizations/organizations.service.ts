import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async updateUser(orgId: string, userId: string, data: { firstName?: string; lastName?: string; role?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== orgId) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot modify admin users');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async toggleUserActive(orgId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== orgId) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot modify admin users');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async deleteUser(orgId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== orgId) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot delete admin users');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
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
