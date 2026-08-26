import { useState, useEffect, useCallback } from 'react';

interface Target {
  id: number;
  x: number;
  y: number;
  hit: boolean;
  reactionTime: number;
  showTime: number;
}

interface SaccadesTrainingProps {
  config: any;
  onComplete: (result: any) => void;
}

export default function SaccadesTrainingPlayer({ config, onComplete }: SaccadesTrainingProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const targetCount = config?.targetCount || 20;
  const targetSize = config?.targetSize || 40;
  const displayDuration = config?.displayDuration || 2000;

  const generateTargets = useCallback(() => {
    const newTargets: Target[] = [];
    for (let i = 0; i < targetCount; i++) {
      newTargets.push({
        id: i,
        x: Math.random() * (window.innerWidth - targetSize - 100) + 50,
        y: Math.random() * (window.innerHeight - targetSize - 200) + 100,
        hit: false,
        reactionTime: 0,
        showTime: 0,
      });
    }
    return newTargets;
  }, [targetCount, targetSize]);

  useEffect(() => {
    if (gameStarted && currentTargetIndex < targets.length) {
      const timer = setTimeout(() => {
        setCurrentTargetIndex((prev) => prev + 1);
      }, displayDuration);

      return () => clearTimeout(timer);
    } else if (gameStarted && currentTargetIndex >= targets.length) {
      setGameOver(true);
      onComplete({
        targets,
        totalTargets: targets.length,
        completedTargets: targets.filter((t) => t.hit).length,
      });
    }
  }, [currentTargetIndex, gameStarted, targets, displayDuration, onComplete]);

  const handleTargetClick = (targetId: number) => {
    if (!gameStarted || gameOver) return;

    setTargets((prev) =>
      prev.map((t) => {
        if (t.id === targetId && !t.hit) {
          const reactionTime = Date.now() - t.showTime;
          setScore((s) => s + 1);
          return { ...t, hit: true, reactionTime };
        }
        return t;
      })
    );
    setCurrentTargetIndex((prev) => prev + 1);
  };

  const startGame = () => {
    const newTargets = generateTargets().map((t, i) => ({
      ...t,
      showTime: Date.now() + i * displayDuration,
    }));
    setTargets(newTargets);
    setGameStarted(true);
    setCurrentTargetIndex(0);
    setScore(0);
    setGameOver(false);
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Saccades Training</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Click on each target as quickly as possible when it appears.
          This exercise helps improve your eye movement speed and accuracy.
        </p>
        <button
          onClick={startGame}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Start Exercise
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Exercise Complete!</h2>
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {score} / {targets.length}
        </div>
        <p className="text-gray-600 mb-6">targets hit</p>
        <button
          onClick={startGame}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow px-4 py-2 z-10">
        <span className="font-medium">Score: {score} / {targets.length}</span>
      </div>

      {targets.map((target, index) => {
        if (index > currentTargetIndex) return null;
        if (index < currentTargetIndex && target.hit) return null;

        const isVisible = index === currentTargetIndex;
        if (!isVisible && index < currentTargetIndex) return null;

        return (
          <button
            key={target.id}
            onClick={() => handleTargetClick(target.id)}
            className="absolute bg-red-500 rounded-full hover:bg-red-600 transition-all duration-200 flex items-center justify-center"
            style={{
              left: target.x,
              top: target.y,
              width: targetSize,
              height: targetSize,
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </button>
        );
      })}
    </div>
  );
}
