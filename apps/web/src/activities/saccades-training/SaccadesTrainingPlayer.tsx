import { useState, useEffect, useCallback, useRef } from 'react';

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface HitResult {
  targetId: number;
  reactionTime: number;
  hit: boolean;
}

interface SaccadesTrainingProps {
  config?: any;
  onComplete: (result: any) => void;
}

type GamePhase = 'intro' | 'countdown' | 'playing' | 'results';

const TARGET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function SaccadesTrainingPlayer({ config, onComplete }: SaccadesTrainingProps) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [countdown, setCountdown] = useState(3);
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState<HitResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'hit' | 'miss' | null>(null);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const targetShowTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const targetCount = config?.targetCount || 15;
  const targetSize = config?.targetSize || 50;
  const showFeedbackEnabled = config?.showFeedback !== false;

  // Countdown timer
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('playing');
      spawnTarget();
    }
  }, [phase, countdown]);

  // Auto-miss if target not clicked in time (2 seconds)
  useEffect(() => {
    if (phase === 'playing' && currentTarget) {
      targetShowTime.current = Date.now();
      timerRef.current = setTimeout(() => {
        // Target expired - miss
        const result: HitResult = {
          targetId: currentTarget.id,
          reactionTime: 2000,
          hit: false,
        };
        setHits((prev) => [...prev, result]);
        setStreak(0);
        if (showFeedbackEnabled) {
          setShowFeedback('miss');
          setTimeout(() => setShowFeedback(null), 400);
        }
        nextTarget();
      }, 2000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [phase, currentTarget, targetIndex]);

  const spawnTarget = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const padding = 80;
    const maxX = container.clientWidth - targetSize - padding;
    const maxY = container.clientHeight - targetSize - padding;

    const newTarget: Target = {
      id: targetIndex,
      x: Math.random() * maxX + padding / 2,
      y: Math.random() * maxY + padding / 2,
      size: targetSize + Math.random() * 20 - 10,
      color: TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)],
    };

    setCurrentTarget(newTarget);
  }, [targetIndex, targetSize]);

  const nextTarget = useCallback(() => {
    const nextIndex = targetIndex + 1;
    setProgress((nextIndex / targetCount) * 100);

    if (nextIndex >= targetCount) {
      // Game over
      setTimeout(() => {
        setPhase('results');
      }, showFeedbackEnabled ? 500 : 0);
    } else {
      setTargetIndex(nextIndex);
    }
  }, [targetIndex, targetCount, showFeedbackEnabled]);

  const handleTargetClick = () => {
    if (phase !== 'playing' || !currentTarget) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const reactionTime = Date.now() - targetShowTime.current;
    const result: HitResult = {
      targetId: currentTarget.id,
      reactionTime,
      hit: true,
    };

    setHits((prev) => [...prev, result]);
    setScore((s) => s + 1);
    setStreak((s) => {
      const newStreak = s + 1;
      if (newStreak > bestStreak) setBestStreak(newStreak);
      return newStreak;
    });

    if (showFeedbackEnabled) {
      setShowFeedback('hit');
      setTimeout(() => setShowFeedback(null), 400);
    }

    nextTarget();
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only count as miss if clicking the background, not the target
    if (e.target === e.currentTarget && phase === 'playing' && currentTarget) {
      if (timerRef.current) clearTimeout(timerRef.current);

      const result: HitResult = {
        targetId: currentTarget.id,
        reactionTime: Date.now() - targetShowTime.current,
        hit: false,
      };
      setHits((prev) => [...prev, result]);
      setStreak(0);

      if (showFeedbackEnabled) {
        setShowFeedback('miss');
        setTimeout(() => setShowFeedback(null), 400);
      }

      nextTarget();
    }
  };

  const startGame = () => {
    setPhase('countdown');
    setCountdown(3);
    setScore(0);
    setHits([]);
    setStreak(0);
    setBestStreak(0);
    setTargetIndex(0);
    setProgress(0);
    setCurrentTarget(null);
  };

  const finishGame = () => {
    const hitResults = hits.filter((h) => h.hit);
    const avgReactionTime = hitResults.length > 0
      ? hitResults.reduce((sum, h) => sum + h.reactionTime, 0) / hitResults.length
      : 0;
    const accuracy = targetCount > 0 ? (score / targetCount) * 100 : 0;

    onComplete({
      targets: hits.map((h) => ({
        x: 0,
        y: 0,
        hit: h.hit,
        reactionTime: h.reactionTime,
      })),
      totalTargets: targetCount,
      completedTargets: score,
      accuracy,
      avgReactionTime,
      bestStreak,
    });
  };

  // INTRO PHASE
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/30">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Saccades Training</h1>
          <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
            Click on each target as quickly as possible when it appears.
            This exercise helps improve your eye movement speed and accuracy.
          </p>

          <div className="glass-card p-6 mb-8 text-left">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">How to Play</h3>
            <ul className="space-y-3">
              {[
                { icon: '🎯', text: 'Click the target as fast as you can when it appears' },
                { icon: '⏱️', text: 'Each target disappears after 2 seconds if not clicked' },
                { icon: '🔥', text: 'Build streaks by hitting targets consecutively' },
                { icon: '📊', text: 'Your accuracy and reaction time are tracked' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-tertiary)] mb-8">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {targetCount} targets
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~{Math.ceil(targetCount * 1.5)}s
            </span>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={finishGame} className="btn-secondary">
              Cancel
            </button>
            <button onClick={startGame} className="btn-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Start Exercise
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COUNTDOWN PHASE
  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div key={countdown} className="text-9xl font-bold text-brand-500 animate-scale-in">
            {countdown}
          </div>
          <p className="text-xl text-[var(--text-secondary)] mt-4">Get Ready...</p>
        </div>
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === 'results') {
    const hitResults = hits.filter((h) => h.hit);
    const avgReactionTime = hitResults.length > 0
      ? hitResults.reduce((sum, h) => sum + h.reactionTime, 0) / hitResults.length
      : 0;
    const accuracy = targetCount > 0 ? (score / targetCount) * 100 : 0;
    const rating = accuracy >= 90 ? 'Excellent' : accuracy >= 70 ? 'Good' : accuracy >= 50 ? 'Fair' : 'Needs Practice';

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <div className="max-w-lg w-full animate-fade-in">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                accuracy >= 70
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                {accuracy >= 70 ? (
                  <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Exercise Complete!</h2>
              <p className="text-[var(--text-secondary)] mt-1">{rating}</p>
            </div>

            {/* Score */}
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-gradient mb-2">{score}/{targetCount}</div>
              <p className="text-[var(--text-secondary)]">targets hit</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(accuracy)}%</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Accuracy</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(avgReactionTime)}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Avg ms</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{bestStreak}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Best Streak</p>
              </div>
            </div>

            {/* Reaction Time Breakdown */}
            {hitResults.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Reaction Times</h3>
                <div className="flex gap-1 flex-wrap">
                  {hitResults.map((h, i) => {
                    const ratio = Math.min(h.reactionTime / 1000, 1);
                    const color = ratio < 0.3 ? 'bg-emerald-500' : ratio < 0.6 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div
                        key={i}
                        className={`h-8 w-3 rounded-full ${color} opacity-80`}
                        title={`${h.reactionTime}ms`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={finishGame} className="flex-1 btn-secondary">
                Close
              </button>
              <button onClick={startGame} className="flex-1 btn-primary">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING PHASE
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden cursor-crosshair select-none"
      onClick={handleBackgroundClick}
    >
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          <div className="glass-card px-4 py-2 flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Score: <span className="text-[var(--text-primary)] font-bold">{score}/{targetCount}</span>
            </span>
            <span className="text-[var(--border-secondary)]">|</span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Streak: <span className="text-brand-500 font-bold">{streak}</span>
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); finishGame(); }}
            className="glass-card px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            End Early
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Feedback overlay */}
      {showFeedback && (
        <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none`}>
          <div className={`text-6xl font-bold animate-scale-in ${
            showFeedback === 'hit' ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {showFeedback === 'hit' ? '+1' : 'MISS'}
          </div>
        </div>
      )}

      {/* Target */}
      {currentTarget && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTargetClick();
          }}
          className="absolute z-30 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 animate-scale-in"
          style={{
            left: currentTarget.x,
            top: currentTarget.y,
            width: currentTarget.size,
            height: currentTarget.size,
            backgroundColor: currentTarget.color,
            boxShadow: `0 0 30px ${currentTarget.color}60, 0 0 60px ${currentTarget.color}30`,
          }}
        >
          <div className="w-3 h-3 bg-white rounded-full opacity-90" />
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
        </button>
      )}
    </div>
  );
}
