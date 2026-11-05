import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AstraeaLogo } from '../brand/AstraeaLogo';

interface GalaxyIntroProps {
  onComplete: () => void;
  reducedMotion?: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  size: number;
  color: string;
  speed: number;
}

interface ExplosionSparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  isStarShape?: boolean;
}

export const GalaxyIntro: React.FC<GalaxyIntroProps> = ({
  onComplete,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [burstDone, setBurstDone] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const explosionParticlesRef = useRef<ExplosionSparkle[]>([]);

  // Total duration: 13.5 seconds
  const TOTAL_DURATION = 13.5;

  const handleFinish = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(() => {
        handleFinish();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [reducedMotion, handleFinish]);

  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1000);
    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  // Canvas Hyperspace Starfield & Logo Particle Explosions Renderer
  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Chromatic colors from the logo: crimson top, amber left, cyan bottom, blue right
    const palette = [
      '#ffffff',
      '#f43f5e', // rose / crimson
      '#fb7185', // pink
      '#fbbf24', // golden amber
      '#38bdf8', // electric cyan
      '#2dd4bf', // teal
      '#60a5fa', // sky blue
      '#818cf8', // indigo
      '#c084fc', // purple / violet
    ];

    // 650 3D Warp Stars for dramatic hyperspace streaking
    const starCount = 650;
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (Math.max(width, height) * 0.95);
      stars.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: Math.random() * 1000 + 30,
        prevZ: 1000,
        size: Math.random() * 2.4 + 0.8,
        color: palette[Math.floor(Math.random() * palette.length)],
        speed: Math.random() * 2.5 + 1.2,
      });
    }

    // Helper: spawn tiny star explosion particles from the logo center or points
    const spawnExplosion = (cx: number, cy: number, count: number, speedMultiplier: number = 1) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 4.5 + 1.5) * speedMultiplier;
        explosionParticlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: Math.random() * 1.2 + 0.6,
          size: Math.random() * 3.5 + 1.2,
          color: palette[Math.floor(Math.random() * palette.length)],
          isStarShape: Math.random() > 0.4,
        });
      }
    };

    const render = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (elapsed >= TOTAL_DURATION) {
        handleFinish();
        return;
      }

      const cx = width / 2;
      const cy = height / 2;

      // 1. Clear deep cosmic background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // 2. Cosmic nebulae around center
      const nebula = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(width, height) * 0.7);
      nebula.addColorStop(0, 'rgba(30, 27, 75, 0.45)');
      nebula.addColorStop(0.35, 'rgba(15, 23, 42, 0.4)');
      nebula.addColorStop(0.7, 'rgba(159, 18, 57, 0.15)');
      nebula.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);

      // 3. WARP SPEED CALCULATION:
      // - 0s to 1.0s: Gentle cosmic drift (speed: 3.5)
      // - 1.0s to 3.6s: Hyperspace zoom acceleration while logo expands from center (speed: 6.5 -> 14.0)
      // - 3.6s to 12.0s: LOGO ARRIVES AT CENTER AND IS 100% STATIONARY,
      //   WHILE STARS CONTINUE TO STREAK AT HIGH WARP VELOCITY PAST THE LOGO (speed: 9.5)!
      //   This gives the intense "still moving through space" optical illusion requested by user!
      // - 12.0s to 13.5s: Decelerating fade into interface
      let warpSpeed = 3.5;
      if (elapsed < 1.0) {
        warpSpeed = 3.5 + elapsed * 2;
      } else if (elapsed >= 1.0 && elapsed < 3.6) {
        const t = (elapsed - 1.0) / 2.6;
        warpSpeed = 5.5 + Math.sin(t * Math.PI) * 11; // Warp burst
      } else if (elapsed >= 3.6 && elapsed < 12.0) {
        // High continuous warp speed while logo is 100% stationary!
        warpSpeed = 9.5;
      } else {
        const t = (elapsed - 12.0) / 1.5;
        warpSpeed = Math.max(1, 9.5 * (1 - t));
      }

      // 4. Trigger supernova explosion when logo arrives and locks into center (at 3.6s)
      if (elapsed >= 3.6 && !burstDone) {
        setBurstDone(true);
        spawnExplosion(cx, cy, 140, 1.6);
      }

      // 5. Continuous tiny star particle explosions bursting outward from the logo (3.6s to 12.0s)
      if (elapsed >= 3.6 && elapsed < 12.0 && Math.random() < 0.6) {
        // Explode outward from top tip, right tip, bottom tip, left tip, or center
        const angles = [
          -Math.PI / 2, // Top (Crimson)
          0,            // Right (Sapphire)
          Math.PI / 2,  // Bottom (Cyan)
          Math.PI,      // Left (Amber)
          Math.random() * Math.PI * 2,
        ];
        const angle = angles[Math.floor(Math.random() * angles.length)];
        const dist = Math.random() * 65 + 15;
        const ex = cx + Math.cos(angle) * dist;
        const ey = cy + Math.sin(angle) * dist;
        spawnExplosion(ex, ey, 8, 1.1);
      }

      // 6. RENDER 3D STARS STREAKING PAST THE LOGO
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.prevZ = s.z;
        s.z -= warpSpeed * s.speed;

        // Reset to deep space if star passes camera
        if (s.z <= 1) {
          s.z = 1000;
          s.prevZ = 1000;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * (Math.max(width, height) * 0.95);
          s.x = Math.cos(angle) * radius;
          s.y = Math.sin(angle) * radius;
        }

        const k = 420 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        const prevK = 420 / s.prevZ;
        const prevPx = s.x * prevK + cx;
        const prevPy = s.y * prevK + cy;

        if (px >= -50 && px <= width + 50 && py >= -50 && py <= height + 50) {
          const depthAlpha = Math.min(1, (1000 - s.z) / 500);

          // DRAW LIGHT STREAKS: Stars streaking rapidly past the viewer and logo!
          ctx.beginPath();
          ctx.strokeStyle = s.color;
          ctx.globalAlpha = depthAlpha * 0.9;
          ctx.lineWidth = Math.max(0.8, s.size * (1 - s.z / 1000) * 1.8);
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.stroke();

          // Star tip glint
          ctx.beginPath();
          ctx.fillStyle = s.color;
          ctx.arc(px, py, Math.max(0.6, s.size * (1 - s.z / 1000) * 2.0), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. RENDER TINY STAR EXPLOSIONS PARTICLES
      for (let b = explosionParticlesRef.current.length - 1; b >= 0; b--) {
        const ep = explosionParticlesRef.current[b];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.vx *= 0.96;
        ep.vy *= 0.96;
        ep.life -= 0.016 / ep.maxLife;

        if (ep.life <= 0) {
          explosionParticlesRef.current.splice(b, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, ep.life);
        ctx.fillStyle = ep.color;

        if (ep.isStarShape) {
          // Draw tiny 4-pointed sparkle explosion star
          const sz = ep.size * ep.life * 1.5;
          ctx.beginPath();
          ctx.moveTo(ep.x, ep.y - sz);
          ctx.lineTo(ep.x + sz * 0.3, ep.y - sz * 0.3);
          ctx.lineTo(ep.x + sz, ep.y);
          ctx.lineTo(ep.x + sz * 0.3, ep.y + sz * 0.3);
          ctx.lineTo(ep.x, ep.y + sz);
          ctx.lineTo(ep.x - sz * 0.3, ep.y + sz * 0.3);
          ctx.lineTo(ep.x - sz, ep.y);
          ctx.lineTo(ep.x - sz * 0.3, ep.y - sz * 0.3);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, ep.size * ep.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      // 8. Dissolve into app at end (12.0s -> 13.5s)
      if (elapsed >= 12.0) {
        const fadeRatio = (elapsed - 12.0) / 1.5;
        ctx.fillStyle = `rgba(2, 6, 23, ${fadeRatio})`;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [reducedMotion, handleFinish, TOTAL_DURATION, burstDone]);

  // LOGO TRAJECTORY (EXACTLY AS INSTRUCTED):
  // - Starts directly in the center: left: 50%, top: 50%, x: 0, y: 0.
  // - Starts TINY AT FIRST in the center: scale: 0.03.
  // - Zooms forward from the center towards the screen (0s -> 5.8s).
  // - When it reaches the center at full size (5.8s), IT STOPS COMPLETELY STATIONARY!
  // - From 5.8s to 12s: Logo is 100% FIXED in place, while the background stars continue
  //   streaking past it at high speed, giving the "still moving" illusion!
  const computeLogoStyle = () => {
    if (reducedMotion) {
      return {
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: Math.min(1, elapsedTime / 0.5),
        glowIntensity: 'medium' as const,
      };
    }

    let scale = 1;
    let opacity = 1;
    let glowIntensity: 'subtle' | 'medium' | 'high' | 'cosmic' = 'high';

    if (elapsedTime < 0.8) {
      // Phase 1: Tiny point of starlight in exact center (0s to 0.8s) - strictly centered, no side movement
      const t = elapsedTime / 0.8;
      scale = 0.04 + t * 0.08;
      opacity = Math.min(0.9, t * 1.4);
      glowIntensity = 'subtle';
    } else if (elapsedTime >= 0.8 && elapsedTime < 3.6) {
      // Phase 2: Hyperspace zoom forward straight towards viewer from center (0.8s to 3.6s)
      const t = (elapsedTime - 0.8) / 2.8;
      // Smooth deceleration curve (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - t, 3);
      scale = 0.12 + easeOut * 0.88;
      opacity = 0.9 + easeOut * 0.1;
      glowIntensity = 'cosmic';
    } else if (elapsedTime >= 3.6 && elapsedTime < 12.0) {
      // Phase 3 & 4: REACHED FULL SCALE (1.0) IN CENTER AND STOPS DEAD!
      // The logo is 100% STATIONARY in the center while background stars streak past at warp speed!
      scale = 1.0;
      opacity = 1.0;
      glowIntensity = elapsedTime < 5.0 ? 'cosmic' : 'high';
    } else {
      // Phase 5: Transition into app (12.0s to 13.5s)
      scale = 1.0;
      const t = (elapsedTime - 12.0) / 1.5;
      opacity = Math.max(0.15, 1 - t * 0.8);
      glowIntensity = 'subtle';
    }

    return {
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      glowIntensity,
    };
  };

  const logoStyle = computeLogoStyle();

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex items-center justify-center select-none"
      aria-live="polite"
      role="region"
      aria-label="Omni Hyperspace Introduction"
    >
      {/* 3D Cosmic Starfield Canvas with High-Speed Streaking Stars */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Centered Logo Entity (Zooms from Center, then Locks Stationary while Stars Streak Past) */}
      <div
        className="absolute left-1/2 top-1/2 will-change-transform flex flex-col items-center justify-center pointer-events-none"
        style={{
          transform: logoStyle.transform,
          opacity: logoStyle.opacity,
        }}
      >
        <AstraeaLogo
          size={160}
          glowIntensity={logoStyle.glowIntensity}
          glow={true}
          withExplosions={true}
          animated={false}
        />

        {/* Wordmark emerges softly after logo stabilizes in center */}
        {elapsedTime >= 4.2 && (
          <div
            className="mt-6 flex flex-col items-center text-center transition-all duration-1000"
            style={{
              opacity: Math.min(1, (elapsedTime - 4.2) / 1.0),
              transform: `translateY(${Math.max(0, (5.2 - elapsedTime) * 8)}px)`,
            }}
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-widest bg-gradient-to-r from-rose-400 via-sky-300 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
              OMNI
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-300 font-bold mt-1.5 drop-shadow">
              Frontier Multimodal Intelligence
            </p>
          </div>
        )}
      </div>

      {/* Accessible Skip Intro Button */}
      {showSkip && (
        <button
          onClick={handleFinish}
          className="absolute bottom-8 right-8 z-50 px-4 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold tracking-wide backdrop-blur-md transition-all shadow-xl hover:shadow-cyan-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 cursor-pointer"
          aria-label="Skip introductory animation"
        >
          Skip Intro <span className="opacity-50 text-[10px] ml-1">(Esc)</span>
        </button>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/60">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-sky-400 to-amber-400 transition-all duration-100 ease-linear"
          style={{ width: `${Math.min(100, (elapsedTime / TOTAL_DURATION) * 100)}%` }}
        />
      </div>
    </div>
  );
};
