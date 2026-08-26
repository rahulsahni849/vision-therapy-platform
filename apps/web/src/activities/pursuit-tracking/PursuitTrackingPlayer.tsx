import { useState, useEffect, useRef, useCallback } from 'react';

interface PursuitTrackingProps {
  config: any;
  onComplete: (result: any) => void;
}

export default function PursuitTrackingPlayer({ config, onComplete }: PursuitTrackingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [trackingData, setTrackingData] = useState<any[]>([]);

  const targetSpeed = config?.targetSpeed || 3;
  const targetSize = config?.targetSize || 20;
  const duration = config?.duration || 30;
  const pattern = config?.pattern || 'circle';

  const targetRef = useRef({ x: 0, y: 0, angle: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>();

  const getTargetPosition = useCallback(
    (time: number, canvasWidth: number, canvasHeight: number) => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(canvasWidth, canvasHeight) / 4;

      switch (pattern) {
        case 'circle':
          return {
            x: centerX + Math.cos(time * targetSpeed * 0.01) * radius,
            y: centerY + Math.sin(time * targetSpeed * 0.01) * radius,
          };
        case 'figure8':
          return {
            x: centerX + Math.cos(time * targetSpeed * 0.01) * radius,
            y: centerY + Math.sin(time * targetSpeed * 0.02) * radius * 0.5,
          };
        case 'random':
          const seed = Math.sin(time * 0.1) * 10000;
          return {
            x: centerX + (seed - Math.floor(seed) - 0.5) * radius * 2,
            y: centerY + (Math.cos(time * targetSpeed * 0.01) * radius),
          };
        default:
          return { x: centerX, y: centerY };
      }
    },
    [pattern, targetSpeed]
  );

  useEffect(() => {
    if (!started || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let startTime = Date.now();
    let dataPoints: any[] = [];

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = duration - elapsed;

      if (remaining <= 0) {
        setGameOver(true);
        onComplete({
          trackingData: dataPoints,
          duration,
          totalSamples: dataPoints.length,
        });
        return;
      }

      setTimeLeft(Math.ceil(remaining));

      const target = getTargetPosition(elapsed, canvas.width, canvas.height);
      targetRef.current = { ...target, angle: elapsed };

      // Clear canvas
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw target
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(target.x, target.y, targetSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(target.x, target.y, targetSize / 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw gaze cursor
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Record data point
      dataPoints.push({
        timestamp: elapsed,
        targetX: target.x,
        targetY: target.y,
        gazeX: mouseRef.current.x,
        gazeY: mouseRef.current.y,
      });

      setTrackingData([...dataPoints]);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [started, gameOver, duration, targetSize, getTargetPosition, onComplete]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startExercise = () => {
    setStarted(true);
    setGameOver(false);
    setTimeLeft(duration);
    setTrackingData([]);
    targetRef.current = { x: 0, y: 0, angle: 0 };
    mouseRef.current = { x: 0, y: 0 };
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Pursuit Tracking</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Follow the moving target with your mouse cursor.
          Keep your cursor as close to the target as possible.
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
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Exercise Complete!</h2>
        <p className="text-gray-600 mb-6">Tracking data recorded: {trackingData.length} samples</p>
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
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow px-4 py-2 z-10">
        <span className="font-medium">Time: {timeLeft}s</span>
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="w-full h-full cursor-none"
        style={{ maxWidth: '100vw', maxHeight: '100vh' }}
      />

      <div className="absolute bottom-4 bg-white rounded-lg shadow px-4 py-2">
        <span className="text-sm text-gray-600">
          Follow the blue target with your red cursor
        </span>
      </div>
    </div>
  );
}
