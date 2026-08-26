import { lazy } from 'react';

export interface ActivityComponent {
  key: string;
  name: string;
  category: string;
  Player: React.LazyExoticComponent<any>;
}

const activityRegistry: Map<string, ActivityComponent> = new Map();

function registerActivity(component: ActivityComponent) {
  activityRegistry.set(component.key, component);
}

// Register activities
registerActivity({
  key: 'saccades-training',
  name: 'Saccades Training',
  category: 'Eye Movement',
  Player: lazy(() => import('./saccades-training/SaccadesTrainingPlayer')),
});

registerActivity({
  key: 'convergence-exercise',
  name: 'Convergence Exercise',
  category: 'Eye Movement',
  Player: lazy(() => import('./convergence-exercise/ConvergenceExercisePlayer')),
});

registerActivity({
  key: 'pursuit-tracking',
  name: 'Pursuit Tracking',
  category: 'Eye Movement',
  Player: lazy(() => import('./pursuit-tracking/PursuitTrackingPlayer')),
});

export function getActivity(key: string): ActivityComponent | undefined {
  return activityRegistry.get(key);
}

export function getAllActivities(): ActivityComponent[] {
  return Array.from(activityRegistry.values());
}

export default activityRegistry;
