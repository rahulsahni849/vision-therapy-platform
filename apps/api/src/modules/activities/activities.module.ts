import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivityRegistry } from './registry/activity-registry';
import { saccadesTraining } from '../../activities/saccades-training/saccades-training';
import { convergenceExercise } from '../../activities/convergence-exercise/convergence-exercise';
import { pursuitTracking } from '../../activities/pursuit-tracking/pursuit-tracking';

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivityRegistry,
    {
      provide: 'ACTIVITY_INIT',
      useFactory: (registry: ActivityRegistry) => {
        registry.register(saccadesTraining);
        registry.register(convergenceExercise);
        registry.register(pursuitTracking);
        return true;
      },
      inject: [ActivityRegistry],
    },
  ],
  exports: [ActivitiesService, ActivityRegistry],
})
export class ActivitiesModule {}
