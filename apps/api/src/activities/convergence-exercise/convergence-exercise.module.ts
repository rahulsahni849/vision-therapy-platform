import { Module } from '@nestjs/common';
import { ActivityRegistry } from '../../modules/activities/registry/activity-registry';
import { convergenceExercise } from './convergence-exercise';

@Module({
  providers: [
    {
      provide: 'ACTIVITY_REGISTRATION',
      useFactory: (registry: ActivityRegistry) => {
        registry.register(convergenceExercise);
        return convergenceExercise;
      },
      inject: [ActivityRegistry],
    },
  ],
})
export class ConvergenceExerciseModule {}
