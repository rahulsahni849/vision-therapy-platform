interface SessionResult {
  accuracy?: number;
  avgReactionTime?: number;
  bestStreak?: number;
  totalTargets?: number;
  completedTargets?: number;
  score?: number;
}

interface SessionResultsModalProps {
  activityName: string;
  result: SessionResult;
  onClose: () => void;
  onPlayAgain: () => void;
  saved?: boolean;
}

export function SessionResultsModal({ activityName, result, onClose, onPlayAgain, saved }: SessionResultsModalProps) {
  const accuracy = result.accuracy || (result.totalTargets ? (result.completedTargets || 0) / result.totalTargets * 100 : 0);
  const score = result.score || result.completedTargets || 0;
  const total = result.totalTargets || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-8 animate-scale-in">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            accuracy >= 70
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            {accuracy >= 70 ? (
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{activityName}</h2>
          <p className="text-[var(--text-secondary)]">Session Complete</p>
          {saved && (
            <span className="inline-flex items-center gap-1 mt-2 badge badge-success">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Results saved
            </span>
          )}
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-gradient">{score}/{total}</div>
          <p className="text-[var(--text-secondary)] mt-1">targets hit</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">{Math.round(accuracy)}%</p>
            <p className="text-xs text-[var(--text-tertiary)]">Accuracy</p>
          </div>
          {result.avgReactionTime !== undefined && (
            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-center">
              <p className="text-xl font-bold text-[var(--text-primary)]">{Math.round(result.avgReactionTime)}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Avg ms</p>
            </div>
          )}
          {result.bestStreak !== undefined && (
            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-center">
              <p className="text-xl font-bold text-[var(--text-primary)]">{result.bestStreak}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Best Streak</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Close
          </button>
          <button onClick={onPlayAgain} className="flex-1 btn-primary">
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
