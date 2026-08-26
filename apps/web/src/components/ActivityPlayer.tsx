import { Suspense, lazy, useState } from 'react';

interface ActivityPlayerProps {
  activityKey: string;
  config?: any;
  onComplete: (result: any) => void;
  onClose: () => void;
}

const activityComponents: Record<string, React.LazyExoticComponent<any>> = {
  'saccades-training': lazy(() => import('../activities/saccades-training/SaccadesTrainingPlayer')),
  'convergence-exercise': lazy(() => import('../activities/convergence-exercise/ConvergenceExercisePlayer')),
  'pursuit-tracking': lazy(() => import('../activities/pursuit-tracking/PursuitTrackingPlayer')),
};

export function ActivityPlayer({ activityKey, config, onComplete, onClose }: ActivityPlayerProps) {
  const ActivityComponent = activityComponents[activityKey];

  if (!ActivityComponent) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Activity Not Available</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            This activity component is not yet implemented.
          </p>
          <button onClick={onClose} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--text-secondary)]">Loading activity...</p>
          </div>
        </div>
      }
    >
      <ActivityComponent config={config} onComplete={onComplete} />
    </Suspense>
  );
}
