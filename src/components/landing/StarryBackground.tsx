
'use client';
import { useMemo } from 'react';

interface StarryBackgroundProps {
  layer: 'small' | 'medium' | 'large';
}

const layerConfig = {
  small: { numStars: 700, size: 1, animation: 'animate-stars-small' },
  medium: { numStars: 200, size: 2, animation: 'animate-stars-medium' },
  large: { numStars: 100, size: 3, animation: 'animate-stars-large' },
};

// This function generates a massive box-shadow string to represent the stars
const generateShadows = (num: number): string => {
  let shadows = '';
  // Generate shadows across a large virtual area to ensure they are spread out
  const area = 2000; 
  for (let i = 0; i < num; i++) {
    shadows += `${Math.random() * area}px ${Math.random() * area}px #FFF${i < num - 1 ? ',' : ''}`;
  }
  return shadows;
};

export default function StarryBackground({ layer }: StarryBackgroundProps) {
  const config = layerConfig[layer];

  // useMemo ensures the shadow string is generated only once per layer
  const starShadows = useMemo(() => generateShadows(config.numStars), [config.numStars]);

  const starStyle: React.CSSProperties = {
    width: `${config.size}px`,
    height: `${config.size}px`,
    background: 'transparent',
    boxShadow: starShadows,
  };

  return (
    <div
      className={`absolute top-0 left-0 right-0 bottom-0 ${config.animation}`}
      style={starStyle}
    />
  );
}
