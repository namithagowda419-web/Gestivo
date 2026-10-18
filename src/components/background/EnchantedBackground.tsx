import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Props {
  isPaused?: boolean;
}

// Firefly particle config
const FIREFLIES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 5 + 3,
  color: ['#a78bfa', '#22d3ee', '#f472b6', '#fcd34d', '#6ee7b7'][i % 5],
  duration: 4 + Math.random() * 5,
  delay: Math.random() * 6,
}));

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  duration: 2 + Math.random() * 4,
  delay: Math.random() * 5,
}));

export default function EnchantedBackground({ isPaused = false }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Canvas-based aurora effect
  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (isPaused) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.003;

      // Aurora ribbons
      const ribbons = [
        { y: 0.2, color: 'rgba(124,58,237,0.06)', phase: 0 },
        { y: 0.45, color: 'rgba(34,211,238,0.05)', phase: 1 },
        { y: 0.7, color: 'rgba(244,114,182,0.04)', phase: 2 },
      ];

      ribbons.forEach((rb) => {
        ctx.beginPath();
        const baseY = canvas.height * rb.y;
        for (let x = 0; x <= canvas.width; x += 8) {
          const y = baseY + Math.sin((x / canvas.width) * Math.PI * 3 + t + rb.phase) * 60
            + Math.sin((x / canvas.width) * Math.PI * 5 + t * 1.3 + rb.phase) * 30;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 80;
        ctx.strokeStyle = rb.color;
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isPaused, prefersReducedMotion]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(109,40,217,0.22) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 40%, rgba(236,72,153,0.12) 0%, transparent 45%),
            #12072b
          `,
        }}
      />

      {/* Aurora canvas */}
      {!prefersReducedMotion && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
      )}

      {/* Twinkling stars */}
      {!prefersReducedMotion &&
        STARS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={isPaused ? {} : { opacity: [0.1, 0.9, 0.1], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

      {/* Fireflies */}
      {!prefersReducedMotion &&
        FIREFLIES.map((fly) => (
          <motion.div
            key={fly.id}
            className="absolute rounded-full"
            style={{
              left: `${fly.x}%`,
              top: `${fly.y}%`,
              width: fly.size,
              height: fly.size,
              background: fly.color,
              boxShadow: `0 0 ${fly.size * 3}px ${fly.color}`,
            }}
            animate={
              isPaused
                ? {}
                : {
                    x: [0, 30, -20, 10, 0],
                    y: [0, -25, 15, -10, 0],
                    opacity: [0, 0.9, 0.5, 0.9, 0],
                    scale: [0.5, 1, 0.7, 1.1, 0.5],
                  }
            }
            transition={{
              duration: fly.duration,
              delay: fly.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
