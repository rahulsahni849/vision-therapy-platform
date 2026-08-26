import { Module } from '@nestjs/common';
import { ActivityRegistry } from '../../modules/activities/registry/activity-registry';
import { saccadesTraining } from './saccades-training';

@Module({
  providers: [
    {
      provide: 'ACTIVITY_REGISTRATION',
      useFactory: (registry: ActivityRegistry) => {
        registry.register(saccadesTraining);
        return saccadesTraining;
      },
      inject: [ActivityRegistry],
    },
  ],
})
export class SaccadesTrainingModule {}
