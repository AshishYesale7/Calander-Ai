
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

const features = [
  {
    title: 'AI-Powered Daily Planning',
    description: 'Calendar.ai intelligently crafts your daily schedule, balancing coursework, career prep, and personal growth to keep you on track.',
    points: [
      'Personalized schedules based on your goals.',
      'Adapts to your fixed classes and appointments.',
      'Ensures consistent progress on long-term objectives.',
    ],
    videoUrl: 'https://cdn.dribbble.com/userupload/12044293/file/original-e8a7ea5949b2d36c2a47547164293521.mp4',
    icon: '🚀',
    gradient: 'from-blue-500/20 to-transparent',
  },
  {
    title: 'Career Vision Roadmap',
    description: 'Describe your dream career, and our AI assistant will generate a step-by-step roadmap, complete with skills to learn and resources to use.',
    points: [
      'Translates aspirations into an actionable plan.',
      'Identifies key skills for your desired industry.',
      'Suggests relevant courses, books, and communities.',
    ],
    videoUrl: 'https://cdn.dribbble.com/userupload/11181559/file/original-27b4931a750965319e6d598585c575d3.mp4',
    icon: '🗺️',
    gradient: 'from-purple-500/20 to-transparent',
  },
  {
    title: 'Integrated Extension Marketplace',
    description: 'Enhance your productivity with powerful plugins like Codefolio Ally, which tracks your competitive programming stats from multiple platforms.',
    points: [
      'Unified dashboard for Codeforces, LeetCode, etc.',
      'Visualizes progress with graphs and charts.',
      'Automatic reminders for upcoming contests.',
    ],
    videoUrl: 'https://cdn.dribbble.com/userupload/11153639/file/original-1945a7b60735398285d693963289a063.mp4',
    icon: '🧩',
    gradient: 'from-teal-500/20 to-transparent',
  },
];


const FeatureCard = ({
  feature,
  index,
  total,
  progress,
  range,
}: {
  feature: (typeof features)[0];
  index: number;
  total: number;
  progress: any;
  range: [number, number];
}) => {
    
    // As the user scrolls, the card in the background will scale down.
    // We are mapping the scroll progress to a scale value.
    // The card is at full size (1) when it's at the center of its range,
    // and shrinks to 0.9 as it moves to the top or bottom of its range.
    const scale = useTransform(
      progress,
      [range[0], (range[0] + range[1]) / 2, range[1]],
      [0.9, 1, 0.9]
    );

    // The content inside the card will fade out as it moves away from the center.
    const contentOpacity = useTransform(
        progress,
        [range[0], (range[0] + range[1]) / 2.1, range[1]],
        [0, 1, 0]
    );
  
    return (
      <motion.div
        style={{
            scale,
            top: `calc(5% + ${index * 5}rem)`,
        }}
        className="sticky w-full h-screen flex items-center justify-center p-4"
      >
        <div 
          className="glow-card" 
          style={{ width: '70vw', height: '75vh' }}
        >
          <div className="glow-card-border" />
          <div className="glow-card-content">
            <motion.div 
                className="w-full h-full p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-8 lg:gap-16"
                style={{ opacity: contentOpacity }}
            >
                {/* Left Side - Text Content */}
                <div className="md:w-1/2 text-center md:text-left relative z-10">
                    <div className="inline-block bg-white/10 p-3 rounded-xl mb-4 text-2xl">{feature.icon}</div>
                    <h2 className="text-3xl lg:text-4xl font-bold font-headline text-white mb-4">{feature.title}</h2>
                    <p className="text-base lg:text-lg text-white/70 mb-6">{feature.description}</p>
                    <ul className="space-y-3">
                        {feature.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-white/80">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Right Side - Video */}
                <div className="md:w-1/2 w-full h-full relative z-10 flex items-center justify-center">
                    <div className="w-full aspect-[16/10] bg-black/50 rounded-xl border-2 border-white/10 shadow-2xl overflow-hidden">
                         <video
                            className="w-full h-full object-cover"
                            src={feature.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                         />
                    </div>
                </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
};


export default function ScrollingFeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className="relative h-[300vh] my-24">
        {features.map((feature, i) => {
            const total = features.length;
            const start = i / total;
            const end = start + (1 / total);
          
            return (
                <FeatureCard
                    key={i}
                    index={i}
                    total={total}
                    feature={feature}
                    progress={scrollYProgress}
                    range={[start, end]}
                />
            );
        })}
    </div>
  );
}
