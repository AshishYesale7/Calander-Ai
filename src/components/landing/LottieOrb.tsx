'use client';

import React, { useRef, useEffect } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { Sparkles } from 'lucide-react';

const LOTTIE_ANIMATION_URL = 'https://cdn.prod.website-files.com/66e88746834b80507cdf7933/67ae3aebcebb1581def51119_orb.json';

export default function LottieOrb() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const handleClick = () => {
        containerRef.current?.classList.add('clicked');
        setTimeout(() => {
          containerRef.current?.classList.remove('clicked');
        }, 400);
      };

      const container = containerRef.current;
      container.addEventListener('click', handleClick);

      return () => {
        container.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <div ref={containerRef} className="orb-container">
      <Lottie
        lottieRef={lottieRef}
        animationData={LOTTIE_ANIMATION_URL}
        loop={true}
        autoplay={true}
        id="lottie-orb"
      />
      <div className="logo-overlay">
        <Sparkles className="w-full h-full text-white" />
      </div>
    </div>
  );
}
