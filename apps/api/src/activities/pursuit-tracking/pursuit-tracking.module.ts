import { Module } from '@nestjs/common';
import { ActivityRegistry } from '../../modules/activities/registry/activity-registry';
import { pursuitTracking } from './pursuit-tracking';

@Module({
  providers: [
    {
      provide: 'ACTIVITY_REGISTRATION',
      useFactory: (registry: ActivityRegistry) => {
        registry.register(pursuitTracking);
        return pursuitTracking;
      },
      inject: [ActivityRegistry],
    },
  ],
})
export class PursuitTrackingModule {}
