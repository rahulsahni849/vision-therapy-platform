import { useState, useEffect, useCallback } from 'react';

interface ConvergenceExerciseProps {
  config: any;
  onComplete: (result: any) => void;
}

export default function ConvergenceExercisePlayer({ config, onComplete }: ConvergenceExerciseProps) {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [distance, setDistance] = useState(0);
  const [trials, setTrials] = useState<any[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [converged, setConverged] = useState(false);

  const maxDistance = config?.maxDistance || 600;
  const minDistance = config?.minDistance || 20;
  const stepSize = config?.stepSize || 10;
  const targetSize = config?.targetSize || 30;
  const totalTrials = 10;

  useEffect(() => {
    if (started && !gameOver) {
      if (!converged) {
        setDistance(maxDistance);
      }
    }
  }, [started, gameOver, converged, maxDistance]);

  const startExercise = () => {
    setStarted(true);
    setGameOver(false);
    setTrials([]);
    setCurrentTrial(0);
    setConverged(false);
    setDistance(maxDistance);
  };

  const handleConverge = () => {
    if (!started || gameOver || converged) return;

    const trial = {
      initialDistance: maxDistance,
      finalDistance: distance,
      converged: distance <= minDistance,
      timeToConverge: Date.now() % 10000,
    };

    setTrials((prev) => [...prev, trial]);
    setConverged(true);

    setTimeout(() => {
      if (currentTrial + 1 >= totalTrials) {
        setGameOver(true);
        onComplete({
          trials: [...trials, trial],
          totalTrials: totalTrials,
          successfulTrials: [...trials, trial].filter((t) => t.converged).length,
        });
      } else {
        setCurrentTrial((prev) => prev + 1);
        setConverged(false);
        setDistance(maxDistance);
      }
    }, 1500);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Convergence Exercise</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Focus on bringing the two targets together until they merge into one.
          Click "Converged" when you've successfully aligned them.
        </p>
        <button
          onClick={startExercise}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Start Exercise
        </button>
      </div>
    );
  }

  if (gameOver) {
    const successCount = trials.filter((t) => t.converged).length;
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Exercise Complete!</h2>
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {successCount} / {totalTrials}
        </div>
        <p className="text-gray-600 mb-6">successful convergences</p>
        <button
          onClick={startExercise}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow px-4 py-2">
        <span className="font-medium">Trial: {currentTrial + 1} / {totalTrials}</span>
      </div>

      <div className="relative" style={{ width: maxDistance + 100, height: 200 }}>
        {/* Left target */}
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-blue-500 rounded-full transition-all duration-100"
          style={{
            left: `calc(50% - ${distance / 2}px - ${targetSize / 2}px)`,
            width: targetSize,
            height: targetSize,
          }}
        />

        {/* Right target */}
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-blue-500 rounded-full transition-all duration-100"
          style={{
            left: `calc(50% + ${distance / 2}px - ${targetSize / 2}px)`,
            width: targetSize,
            height: targetSize,
          }}
        />
      </div>

      <div className="mt-8 flex gap-4">
        {!converged ? (
          <>
            <button
              onClick={() => setDistance((d) => Math.max(minDistance, d - stepSize))}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              ← Converge →
            </button>
            <button
              onClick={handleConverge}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Converged!
            </button>
          </>
        ) : (
          <div className="text-lg font-medium text-green-600">
            {trials[currentTrial]?.converged ? 'Success!' : 'Try again...'}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 text-sm text-gray-500">
        Distance: {Math.round(distance)}px
      </div>
    </div>
  );
}
