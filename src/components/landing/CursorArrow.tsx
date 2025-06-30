'use client';

import { useState, useEffect, type RefObject } from 'react';

interface CursorArrowProps {
  targetRef: RefObject<HTMLElement>;
}

export default function CursorArrow({ targetRef }: CursorArrowProps) {
  const [path, setPath] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!targetRef.current) return;
      if (!isVisible) setIsVisible(true);

      const targetRect = targetRef.current.getBoundingClientRect();
      // Target the bottom center of the button
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.bottom + 10;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // A single control point to define the arc
      // Place it halfway between mouse and target on X, but dip it down on Y
      const controlX = mouseX + (targetX - mouseX) * 0.5;
      const controlY = Math.max(mouseY, targetY) + 100;

      const newPath = `M ${mouseX} ${mouseY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
      setPath(newPath);
    };

    // Delay attachment to avoid immediate rendering at 0,0
    const timer = setTimeout(() => {
        window.addEventListener('mousemove', handleMouseMove);
    }, 100);


    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [targetRef, isVisible]);

  return (
    <svg
      className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-30"
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="5"
          markerHeight="3.5"
          refX="5"
          refY="1.75"
          orient="auto"
        >
          <polygon points="0 0, 5 1.75, 0 3.5" fill="rgba(255, 255, 255, 0.4)" />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1.5"
        strokeDasharray="6 6"
        markerEnd="url(#arrowhead)"
      />
    </svg>
  );
}
