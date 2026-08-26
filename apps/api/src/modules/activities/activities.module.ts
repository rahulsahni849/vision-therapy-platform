import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivityRegistry } from './registry/activity-registry';
import { SaccadesTrainingModule } from '../../activities/saccades-training/saccades-training.module';
import { ConvergenceExerciseModule } from '../../activities/convergence-exercise/convergence-exercise.module';
import { PursuitTrackingModule } from '../../activities/pursuit-tracking/pursuit-tracking.module';

@Module({
  imports: [
    SaccadesTrainingModule,
    ConvergenceExerciseModule,
    PursuitTrackingModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivityRegistry],
  exports: [ActivitiesService, ActivityRegistry],
})
export class ActivitiesModule {}
