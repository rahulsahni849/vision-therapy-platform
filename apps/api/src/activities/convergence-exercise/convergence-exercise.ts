import { z } from 'zod';
import { ActivityModuleType } from '@vision/shared';

const convergenceConfigSchema = {
  maxDistance: z.number().min(100).max(1000).default(600),
  minDistance: z.number().min(10).max(100).default(20),
  stepSize: z.number().min(5).max(50).default(10),
  holdDuration: z.number().min(500).max(3000).default(1000),
  targetSize: z.number().min(20).max(100).default(30),
};

export const convergenceExercise: ActivityModuleType = {
  manifest: {
    key: 'convergence-exercise',
    name: 'Convergence Exercise',
    category: 'Eye Movement',
    configSchema: convergenceConfigSchema,
    version: '1.0.0',
  },

  scoreSession(rawResult: unknown) {
    const result = rawResult as {
      trials: Array<{ initialDistance: number; finalDistance: number; converged: boolean; timeToConverge: number }>;
      totalTrials: number;
      successfulTrials: number;
    };

    if (!result.trials || !Array.isArray(result.trials)) {
      return [];
    }

    const successfulTrials = result.trials.filter((t) => t.converged);
    const convergenceRate = result.totalTrials > 0 ? (successfulTrials.length / result.totalTrials) * 100 : 0;
    const avgTimeToConverge =
      successfulTrials.length > 0
        ? successfulTrials.reduce((sum, t) => sum + t.timeToConverge, 0) / successfulTrials.length
        : 0;
    const avgFinalDistance =
      successfulTrials.length > 0
        ? successfulTrials.reduce((sum, t) => sum + t.finalDistance, 0) / successfulTrials.length
        : 0;

    return [
      { key: 'convergence_rate', value: Math.round(convergenceRate * 100) / 100 },
      { key: 'avg_time_to_converge', value: Math.round(avgTimeToConverge) },
      { key: 'avg_final_distance', value: Math.round(avgFinalDistance * 100) / 100 },
      { key: 'total_successful', value: successfulTrials.length },
      { key: 'score', value: Math.round(convergenceRate) },
    ];
  },
};
