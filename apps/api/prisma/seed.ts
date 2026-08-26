import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Vision Therapy Clinic',
    },
  });

  // Create default admin
  const adminPasswordHash = await argon2.hash('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@visiontherapy.com' },
    update: {},
    create: {
      email: 'admin@visiontherapy.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      organizationId: org.id,
      isActive: true,
    },
  });

  // Create default practitioner
  const practitionerPasswordHash = await argon2.hash('Practitioner123!');
  const practitioner = await prisma.user.upsert({
    where: { email: 'practitioner@visiontherapy.com' },
    update: {},
    create: {
      email: 'practitioner@visiontherapy.com',
      passwordHash: practitionerPasswordHash,
      role: 'PRACTITIONER',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      organizationId: org.id,
      isActive: true,
    },
  });

  // Create default patient
  const patientPasswordHash = await argon2.hash('Patient123!');
  const patient = await prisma.user.upsert({
    where: { email: 'patient@visiontherapy.com' },
    update: {},
    create: {
      email: 'patient@visiontherapy.com',
      passwordHash: patientPasswordHash,
      role: 'PATIENT',
      firstName: 'John',
      lastName: 'Doe',
      organizationId: org.id,
      isActive: true,
    },
  });

  // Seed activities
  const activities = [
    {
      key: 'saccades-training',
      name: 'Saccades Training',
      category: 'Eye Movement',
      configSchema: {
        targetCount: { type: 'number', min: 5, max: 50, default: 20 },
        targetSize: { type: 'number', min: 20, max: 100, default: 40 },
        displayDuration: { type: 'number', min: 500, max: 5000, default: 2000 },
        showFeedback: { type: 'boolean', default: true },
      },
      version: '1.0.0',
    },
    {
      key: 'convergence-exercise',
      name: 'Convergence Exercise',
      category: 'Eye Movement',
      configSchema: {
        maxDistance: { type: 'number', min: 100, max: 1000, default: 600 },
        minDistance: { type: 'number', min: 10, max: 100, default: 20 },
        stepSize: { type: 'number', min: 5, max: 50, default: 10 },
        holdDuration: { type: 'number', min: 500, max: 3000, default: 1000 },
        targetSize: { type: 'number', min: 20, max: 100, default: 30 },
      },
      version: '1.0.0',
    },
    {
      key: 'pursuit-tracking',
      name: 'Pursuit Tracking',
      category: 'Eye Movement',
      configSchema: {
        targetSpeed: { type: 'number', min: 1, max: 10, default: 3 },
        targetSize: { type: 'number', min: 10, max: 50, default: 20 },
        duration: { type: 'number', min: 10, max: 120, default: 30 },
        pattern: { type: 'string', enum: ['circle', 'figure8', 'random'], default: 'circle' },
        showTrail: { type: 'boolean', default: true },
      },
      version: '1.0.0',
    },
  ];

  for (const activityData of activities) {
    const activity = await prisma.activity.upsert({
      where: { key: activityData.key },
      update: activityData,
      create: activityData,
    });

    // Enable activity for the organization
    await prisma.orgActivity.upsert({
      where: {
        organizationId_activityId: {
          organizationId: org.id,
          activityId: activity.id,
        },
      },
      update: { isEnabled: true },
      create: {
        organizationId: org.id,
        activityId: activity.id,
        isEnabled: true,
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log('Default accounts:');
  console.log('  Admin: admin@visiontherapy.com / Admin123!');
  console.log('  Practitioner: practitioner@visiontherapy.com / Practitioner123!');
  console.log('  Patient: patient@visiontherapy.com / Patient123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
