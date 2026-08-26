import { z } from 'zod';
import { ActivityModuleType } from '@vision/shared';

const saccadesConfigSchema = {
  targetCount: z.number().min(5).max(50).default(20),
  targetSize: z.number().min(20).max(100).default(40),
  displayDuration: z.number().min(500).max(5000).default(2000),
  showFeedback: z.boolean().default(true),
};

export const saccadesTraining: ActivityModuleType = {
  manifest: {
    key: 'saccades-training',
    name: 'Saccades Training',
    category: 'Eye Movement',
    configSchema: saccadesConfigSchema,
    version: '1.0.0',
  },

  scoreSession(rawResult: unknown) {
    const result = rawResult as {
      targets: Array<{ x: number; y: number; hit: boolean; reactionTime: number }>;
      totalTargets: number;
      completedTargets: number;
    };

    if (!result.targets || !Array.isArray(result.targets)) {
      return [];
    }

    const hitTargets = result.targets.filter((t) => t.hit);
    const accuracy = result.totalTargets > 0 ? (hitTargets.length / result.totalTargets) * 100 : 0;
    const avgReactionTime =
      hitTargets.length > 0
        ? hitTargets.reduce((sum, t) => sum + t.reactionTime, 0) / hitTargets.length
        : 0;

    return [
      { key: 'accuracy', value: Math.round(accuracy * 100) / 100 },
      { key: 'avg_reaction_time', value: Math.round(avgReactionTime) },
      { key: 'total_hits', value: hitTargets.length },
      { key: 'total_misses', value: result.totalTargets - hitTargets.length },
      { key: 'score', value: Math.round(accuracy) },
    ];
  },
};
