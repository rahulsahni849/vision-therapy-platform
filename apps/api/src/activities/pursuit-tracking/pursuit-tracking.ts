import { z } from 'zod';
import { ActivityModuleType } from '@vision/shared';

const pursuitConfigSchema = {
  targetSpeed: z.number().min(1).max(10).default(3),
  targetSize: z.number().min(10).max(50).default(20),
  duration: z.number().min(10).max(120).default(30),
  pattern: z.enum(['circle', 'figure8', 'random']).default('circle'),
  showTrail: z.boolean().default(true),
};

export const pursuitTracking: ActivityModuleType = {
  manifest: {
    key: 'pursuit-tracking',
    name: 'Pursuit Tracking',
    category: 'Eye Movement',
    configSchema: pursuitConfigSchema,
    version: '1.0.0',
  },

  scoreSession(rawResult: unknown) {
    const result = rawResult as {
      trackingData: Array<{ timestamp: number; targetX: number; targetY: number; gazeX: number; gazeY: number }>;
      duration: number;
      totalSamples: number;
    };

    if (!result.trackingData || !Array.isArray(result.trackingData)) {
      return [];
    }

    // Calculate tracking accuracy (average distance between gaze and target)
    const distances = result.trackingData.map((point) => {
      const dx = point.targetX - point.gazeX;
      const dy = point.targetY - point.gazeY;
      return Math.sqrt(dx * dx + dy * dy);
    });

    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    const minDistance = Math.min(...distances);

    // Calculate tracking smoothness (variance in distance)
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const smoothness = Math.max(0, 100 - Math.sqrt(variance));

    // Score based on accuracy and smoothness (0-100)
    const accuracyScore = Math.max(0, 100 - avgDistance);
    const score = Math.round((accuracyScore * 0.7 + smoothness * 0.3));

    return [
      { key: 'avg_distance', value: Math.round(avgDistance * 100) / 100 },
      { key: 'max_distance', value: Math.round(maxDistance * 100) / 100 },
      { key: 'min_distance', value: Math.round(minDistance * 100) / 100 },
      { key: 'smoothness', value: Math.round(smoothness * 100) / 100 },
      { key: 'score', value: Math.round(score) },
    ];
  },
};
