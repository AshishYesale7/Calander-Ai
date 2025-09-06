'use client';

import React, { useRef } from 'react';
import { useGravityWell } from '@/hooks/useGravityWell';
import { cn } from '@/lib/utils';

export default function GravityWellBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGravityWell({ containerRef, canvasRef });

  return (
    <div ref={containerRef} className="absolute inset-0 gravity-well-container">
      {/* The canvas for the particle animation is now managed by the hook */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* The new elements from the user's reference code */}
      <div className="aura"></div>
      <div className="overlay"></div>
    </div>
  );
}