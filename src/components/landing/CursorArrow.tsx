'use client';

import { useState, useEffect, type RefObject, useRef, useCallback } from 'react';

interface CursorArrowProps {
  targetRef: RefObject<HTMLElement>;
}

export default function CursorArrow({ targetRef }: CursorArrowProps) {
  const [path, setPath] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Use useCallback to memoize the update function, preventing re-creation on every render
  const updateArrow = useCallback(() => {
    if (!targetRef.current) return;

    const { x: mouseX, y: mouseY } = mousePositionRef.current;
    
    // Don't draw if the mouse hasn't moved yet
    if (mouseX === 0 && mouseY === 0) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.bottom + 10;

    const controlX = mouseX + (targetX - mouseX) * 0.5;
    const controlY = Math.max(mouseY, targetY) + 100;

    setPath(`M ${mouseX} ${mouseY} Q ${controlX} ${controlY} ${targetX} ${targetY}`);
  }, [targetRef]); // Dependency on targetRef ensures it's up to date

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
      updateArrow();
    };

    const handleScroll = () => {
      // Recalculate path on scroll using the last known mouse position
      if (isVisible) {
        updateArrow();
      }
    };

    // Delay attachment to avoid immediate rendering at 0,0
    const timer = setTimeout(() => {
      window.addEventListener('mousemove', handleMouseMove);
      // Add the crucial scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible, updateArrow]); // Rerun effect if isVisible or updateArrow changes

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
