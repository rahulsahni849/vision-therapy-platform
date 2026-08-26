import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    ActivitiesModule,
    AssignmentsModule,
    SessionsModule,
    ReportingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
