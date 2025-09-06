
'use client';

import { useEffect, useRef, useCallback } from 'react';

// Easing functions for animations, moved directly into the hook.
const easingUtils = {
    linear: (t: number) => t,
    inQuad: (t: number) => t * t,
    outQuad: (t: number) => t * (2 - t),
    inOutQuad: (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    inCubic: (t: number) => t * t * t,
    outCubic: (t: number) => (--t) * t * t + 1,
    inOutCubic: (t: number) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    inQuart: (t: number) => t * t * t * t,
    outQuart: (t: number) => 1 - (--t) * t * t * t,
    inOutQuart: (t: number) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    inQuint: (t: number) => t * t * t * t * t,
    outQuint: (t: number) => 1 + (--t) * t * t * t * t,
    inOutQuint: (t: number) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    inSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
    outSine: (t: number) => Math.sin(t * Math.PI / 2),
    inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
    inExpo: (t: number) => Math.pow(2, 10 * (t - 1)),
    outExpo: (t: number) => 1 - Math.pow(2, -10 * t),
    inOutExpo: (t: number) => (t=t*2-1) < 0 ? .5 * Math.pow(2, 10 * t) : .5 * (2 - Math.pow(2, -10 * t)),
    inCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
    outCirc: (t: number) => Math.sqrt(1 - (--t) * t),
    inOutCirc: (t: number) => (t *= 2) < 1 ? -1/2 * (Math.sqrt(1 - t*t) - 1) : 1/2 * (Math.sqrt(1 - (t-=2)*t) + 1),
};


interface UseGravityWellProps {
  containerRef: React.RefObject<HTMLElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const useGravityWell = ({ containerRef, canvasRef }: UseGravityWellProps) => {
  const animationFrameId = useRef<number>();

  const state = useRef({
    ctx: null as CanvasRenderingContext2D | null,
    rect: { width: 0, height: 0, dpi: 1 },
    startDisc: { x: 0, y: 0, w: 0, h: 0 },
    endDisc: { x: 0, y: 0, w: 0, h: 0 },
    discs: [] as any[],
    lines: [] as any[],
    particles: [] as any[],
    clip: {} as any,
    particleArea: {} as any,
    linesCanvas: null as OffscreenCanvas | null,
  });

  const tweenValue = (start: number, end: number, p: number, ease?: keyof typeof easingUtils) => {
    const delta = end - start;
    const easeFn = ease ? easingUtils[ease] : easingUtils.linear;
    return start + delta * easeFn(p);
  };

  const tweenDisc = useCallback((disc: any) => {
    const { startDisc, endDisc } = state.current;
    disc.x = tweenValue(startDisc.x, endDisc.x, disc.p);
    disc.y = tweenValue(startDisc.y, endDisc.y, disc.p, 'inExpo');
    disc.w = tweenValue(startDisc.w, endDisc.w, disc.p);
    disc.h = tweenValue(startDisc.h, endDisc.h, disc.p);
    return disc;
  }, []);

  const setDiscs = useCallback(() => {
    const { width, height } = state.current.rect;
    state.current.discs = [];

    // --- ADJUSTED VALUES TO MATCH IMAGE ---
    // A lower 'y' and much lower 'h' create a flatter, more tilted perspective.
    state.current.startDisc = { x: width * 0.5, y: height * 0.45, w: width * 0.75, h: height * 0.2 };
    state.current.endDisc = { x: width * 0.5, y: height * 0.95, w: 0, h: 0 };
    // --- END ADJUSTED VALUES ---

    const totalDiscs = 100;
    let prevBottom = height;
    state.current.clip = {};

    for (let i = 0; i < totalDiscs; i++) {
      const p = i / totalDiscs;
      const disc = tweenDisc({ p });
      const bottom = disc.y + disc.h;
      if (bottom <= prevBottom) {
        state.current.clip = { disc: { ...disc }, i };
      }
      prevBottom = bottom;
      state.current.discs.push(disc);
    }
    
    if (state.current.clip.disc) {
        state.current.clip.path = new Path2D();
        state.current.clip.path.ellipse(state.current.clip.disc.x, state.current.clip.disc.y, state.current.clip.disc.w, state.current.clip.disc.h, 0, 0, Math.PI * 2);
        state.current.clip.path.rect(state.current.clip.disc.x - state.current.clip.disc.w, 0, state.current.clip.disc.w * 2, state.current.clip.disc.y);
    }
  }, [tweenDisc]);

  const setLines = useCallback(() => {
    const { width, height } = state.current.rect;
    if (!width || !height || !state.current.clip.path) return;
    
    state.current.lines = [];
    const totalLines = 100;
    const linesAngle = (Math.PI * 2) / totalLines;

    for (let i = 0; i < totalLines; i++) state.current.lines.push([]);

    state.current.discs.forEach((disc) => {
      for (let i = 0; i < totalLines; i++) {
        const angle = i * linesAngle;
        const p = { x: disc.x + Math.cos(angle) * disc.w, y: disc.y + Math.sin(angle) * disc.h };
        state.current.lines[i].push(p);
      }
    });

    state.current.linesCanvas = new OffscreenCanvas(width, height);
    const ctx = state.current.linesCanvas.getContext('2d');
    if (!ctx) return;

    state.current.lines.forEach((line) => {
      ctx.save();
      let lineIsIn = false;
      line.forEach((p1, j) => {
        if (j === 0) return;
        const p0 = line[j - 1];
        if (!lineIsIn && (ctx.isPointInPath(state.current.clip.path, p1.x, p1.y))) {
          lineIsIn = true;
        } else if (lineIsIn) {
          ctx.clip(state.current.clip.path);
        }
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      });
      ctx.restore();
    });
  }, []);

  const initParticle = useCallback((start = false) => {
    const { height } = state.current.rect;
    const area = state.current.particleArea;
    if (!area.h) return null;
    const sx = area.sx + area.sw * Math.random();
    const ex = area.ex + area.ew * Math.random();
    const dx = ex - sx;
    const y = start ? area.h * Math.random() : area.h;
    const r = 0.5 + Math.random() * 4;
    const vy = 0.5 + Math.random();
    return { x: sx, sx, dx, y, vy, p: 0, r, c: `rgba(255, 255, 255, ${Math.random()})` };
  }, []);

  const setParticles = useCallback(() => {
    const { width, height } = state.current.rect;
    const clipDisc = state.current.clip.disc;
    if (!clipDisc) return;
    
    state.current.particles = [];
    state.current.particleArea = {
      sw: clipDisc.w * 0.5,
      ew: clipDisc.w * 2,
      h: height * 0.85
    };
    state.current.particleArea.sx = (width - state.current.particleArea.sw) / 2;
    state.current.particleArea.ex = (width - state.current.particleArea.ew) / 2;
    
    const totalParticles = 100;
    for (let i = 0; i < totalParticles; i++) {
      const particle = initParticle(true);
      if (particle) state.current.particles.push(particle);
    }
  }, [initParticle]);

  const drawDiscs = useCallback(() => {
    const { ctx, startDisc, clip, discs } = state.current;
    if (!ctx) return;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(startDisc.x, startDisc.y, startDisc.w, startDisc.h, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    discs.forEach((disc, i) => {
      if (i % 5 !== 0) return;
      if (disc.w < clip.disc.w - 5) {
        ctx.save();
        ctx.clip(clip.path);
      }
      ctx.beginPath();
      ctx.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();
      if (disc.w < clip.disc.w - 5) ctx.restore();
    });
  }, []);

  const drawLines = useCallback(() => {
    const { ctx, linesCanvas } = state.current;
    if (ctx && linesCanvas) {
      ctx.drawImage(linesCanvas, 0, 0);
    }
  }, []);

  const drawParticles = useCallback(() => {
    const { ctx, clip, particles } = state.current;
    if (!ctx || !clip.path) return;
    ctx.save();
    ctx.clip(clip.path);
    particles.forEach((particle) => {
      ctx.fillStyle = particle.c;
      ctx.beginPath();
      ctx.rect(particle.x, particle.y, particle.r, particle.r);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }, []);

  const moveDiscs = useCallback(() => {
    state.current.discs.forEach((disc) => {
      disc.p = (disc.p + 0.001) % 1;
      tweenDisc(disc);
    });
  }, [tweenDisc]);

  const moveParticles = useCallback(() => {
    state.current.particles.forEach((particle) => {
      particle.p = 1 - particle.y / state.current.particleArea.h;
      particle.x = particle.sx + particle.dx * particle.p;
      particle.y -= particle.vy;
      if (particle.y < 0) {
        const newParticle = initParticle();
        if (newParticle) {
          particle.x = newParticle.x;
          particle.sx = newParticle.sx;
          particle.dx = newParticle.dx;
          particle.y = newParticle.y;
        }
      }
    });
  }, [initParticle]);

  const tick = useCallback(() => {
    const { ctx, rect } = state.current;
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.save();
    ctx.scale(rect.dpi, rect.dpi);
    moveDiscs();
    moveParticles();
    drawDiscs();
    drawLines();
    drawParticles();
    ctx.restore();
    animationFrameId.current = requestAnimationFrame(tick);
  }, [drawDiscs, drawLines, drawParticles, moveDiscs, moveParticles, canvasRef]);

  useEffect(() => {
    const setup = () => {
        if (!containerRef.current || !canvasRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dpi = window.devicePixelRatio;
        state.current.rect = { width: rect.width, height: rect.height, dpi };
        state.current.ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = rect.width * dpi;
        canvasRef.current.height = rect.height * dpi;
        setDiscs();
        setLines();
        setParticles();
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(tick);
    };
    
    // Only run setup on the client side
    if (typeof window !== 'undefined' && containerRef.current) {
        setup();
        window.addEventListener('resize', setup);
    }
    
    return () => {
      if(typeof window !== 'undefined') {
        window.removeEventListener('resize', setup);
      }
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [setDiscs, setLines, setParticles, tick]);
};

    
