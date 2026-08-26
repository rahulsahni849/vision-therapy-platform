import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityRegistry } from './registry/activity-registry';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private registry: ActivityRegistry,
  ) {}

  async getAllActivities() {
    return this.prisma.activity.findMany();
  }

  async getActivityByKey(key: string) {
    const activity = await this.prisma.activity.findUnique({ where: { key } });
    if (!activity) {
      throw new NotFoundException(`Activity "${key}" not found`);
    }
    return activity;
  }

  async seedActivities() {
    const manifests = this.registry.getManifests();
    for (const manifest of manifests) {
      await this.prisma.activity.upsert({
        where: { key: manifest.key },
        update: {
          name: manifest.name,
          category: manifest.category,
          configSchema: manifest.configSchema,
          version: manifest.version,
        },
        create: {
          key: manifest.key,
          name: manifest.name,
          category: manifest.category,
          configSchema: manifest.configSchema,
          version: manifest.version,
        },
      });
    }
    return { message: `Seeded ${manifests.length} activities` };
  }

  async getEnabledActivitiesForOrg(orgId: string) {
    return this.prisma.orgActivity.findMany({
      where: { organizationId: orgId, isEnabled: true },
      include: { activity: true },
    });
  }
}
