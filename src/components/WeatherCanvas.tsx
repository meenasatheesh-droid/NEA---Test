import React, { useEffect, useRef } from 'react';
import { WeatherEffectMode } from '../types/weather';

interface WeatherCanvasProps {
  mode: WeatherEffectMode;
  pm25Value?: number;
  rainfallMm?: number;
}

interface RainParticle {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
}

interface SplashParticle {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface HazeParticle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  phase: number;
}

interface SunnyParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({ mode, pm25Value = 0, rainfallMm = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute active effect when in auto mode
  let effectiveMode: WeatherEffectMode = mode;
  if (mode === 'auto') {
    if (rainfallMm > 10) {
      effectiveMode = 'storm';
    } else if (rainfallMm > 2.5) {
      effectiveMode = 'rain';
    } else if (rainfallMm > 0) {
      effectiveMode = 'drizzle';
    } else if (pm25Value > 55) {
      effectiveMode = 'haze';
    } else {
      effectiveMode = 'sunny';
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (effectiveMode === 'off') {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pools
    const raindrops: RainParticle[] = [];
    const splashes: SplashParticle[] = [];
    const hazeParticles: HazeParticle[] = [];
    const sunnyParticles: SunnyParticle[] = [];

    // Initialize rain based on intensity
    const isStorm = effectiveMode === 'storm';
    const isDrizzle = effectiveMode === 'drizzle';
    const isRain = effectiveMode === 'rain' || isStorm || isDrizzle;

    const rainDropCount = isStorm ? 300 : isDrizzle ? 90 : Math.min(220, Math.max(60, Math.round(rainfallMm * 25 + 60)));

    if (isRain) {
      for (let i = 0; i < rainDropCount; i++) {
        raindrops.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          length: isDrizzle ? 8 + Math.random() * 8 : isStorm ? 24 + Math.random() * 20 : 15 + Math.random() * 15,
          speed: isDrizzle ? 7 + Math.random() * 5 : isStorm ? 20 + Math.random() * 10 : 12 + Math.random() * 8,
          opacity: isDrizzle ? 0.25 + Math.random() * 0.25 : 0.35 + Math.random() * 0.45,
          width: isDrizzle ? 1 : isStorm ? 1.5 + Math.random() * 1.2 : 1.2 + Math.random() * 0.8,
        });
      }
    }

    // Initialize haze
    if (effectiveMode === 'haze') {
      const hazeCount = Math.min(80, Math.max(30, Math.round(pm25Value / 2)));
      for (let i = 0; i < hazeCount; i++) {
        hazeParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 35 + Math.random() * 85,
          speedX: 0.2 + Math.random() * 0.4,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: 0.04 + Math.random() * 0.08,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Initialize sunny/clear
    if (effectiveMode === 'sunny') {
      for (let i = 0; i < 45; i++) {
        sunnyParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1.5 + Math.random() * 3,
          speedY: -0.2 - Math.random() * 0.3,
          speedX: (Math.random() - 0.5) * 0.3,
          opacity: 0.2 + Math.random() * 0.4,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    let lightningTimer = 0;
    let lightningOpacity = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. RAIN / DRIZZLE / STORM
      if (isRain) {
        // Lightning effect in storm mode
        if (isStorm) {
          lightningTimer++;
          if (lightningTimer > 280 && Math.random() < 0.02) {
            lightningOpacity = 0.35 + Math.random() * 0.3;
            lightningTimer = 0;
          }
          if (lightningOpacity > 0.01) {
            ctx.fillStyle = `rgba(230, 240, 255, ${lightningOpacity})`;
            ctx.fillRect(0, 0, width, height);
            lightningOpacity *= 0.85;
          }
        }

        const angle = isStorm ? 0.35 : 0.18; // wind shear
        ctx.lineCap = 'round';

        // Draw raindrops
        raindrops.forEach((drop) => {
          ctx.beginPath();
          ctx.strokeStyle = isStorm
            ? `rgba(180, 215, 255, ${drop.opacity})`
            : isDrizzle
            ? `rgba(165, 220, 250, ${drop.opacity})`
            : `rgba(145, 205, 255, ${drop.opacity})`;
          ctx.lineWidth = drop.width;

          const dx = drop.length * Math.sin(angle);
          const dy = drop.length * Math.cos(angle);

          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + dx, drop.y + dy);
          ctx.stroke();

          drop.x += drop.speed * Math.sin(angle);
          drop.y += drop.speed * Math.cos(angle);

          // Splash on floor
          if (drop.y > height - 10) {
            if (splashes.length < 50 && Math.random() < 0.3) {
              splashes.push({
                x: drop.x,
                y: height - Math.random() * 15,
                radius: 1,
                maxRadius: 4 + Math.random() * 6,
                opacity: 0.45,
              });
            }
            drop.y = -20;
            drop.x = Math.random() * (width + 200) - 100;
          }
          if (drop.x > width + 100) drop.x = -50;
        });

        // Draw splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius * 1.8, s.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(160, 215, 255, ${s.opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          s.radius += 0.5;
          s.opacity -= 0.035;

          if (s.opacity <= 0 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
          }
        }
      }

      // 2. HAZE / SMOG
      if (effectiveMode === 'haze') {
        const isHighHaze = pm25Value > 100;
        const tint = isHighHaze ? '245, 158, 11' : '217, 119, 6'; // warm amber haze

        // Atmospheric haze overlay wash
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, `rgba(${tint}, ${Math.min(0.18, 0.04 + pm25Value * 0.0008)})`);
        bgGrad.addColorStop(1, `rgba(${tint}, ${Math.min(0.24, 0.06 + pm25Value * 0.001)})`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        hazeParticles.forEach((p) => {
          p.phase += 0.01;
          p.x += p.speedX;
          p.y += p.speedY + Math.sin(p.phase) * 0.1;

          if (p.x - p.radius > width) p.x = -p.radius;
          if (p.y - p.radius > height) p.y = -p.radius;
          if (p.y + p.radius < 0) p.y = height + p.radius;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(${tint}, ${p.opacity})`);
          grad.addColorStop(1, `rgba(${tint}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 3. SUNNY / CLEAR
      if (effectiveMode === 'sunny') {
        // Soft golden cyan shimmer particles
        sunnyParticles.forEach((p) => {
          p.pulsePhase += p.pulseSpeed;
          p.y += p.speedY;
          p.x += p.speedX;

          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulsePhase));
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
          grad.addColorStop(0, `rgba(56, 189, 248, ${currentOpacity})`);
          grad.addColorStop(0.5, `rgba(251, 191, 36, ${currentOpacity * 0.4})`);
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [effectiveMode, rainfallMm, pm25Value]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
