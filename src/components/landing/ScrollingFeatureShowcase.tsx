
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
    colors: {
        '--border-color': '#c084fc',
        '--box-shadow-color': '#a855f7',
        '--glow-color-1': '#9333ea',
        '--glow-color-2': '#a855f7',
        '--glow-color-3': '#d8b4fe',
        '--glow-color-4': '#c084fc',
    }
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
    colors: {
        '--border-color': '#FBBF24',
        '--box-shadow-color': '#F59E0B',
        '--glow-color-1': '#D97706',
        '--glow-color-2': '#F59E0B',
        '--glow-color-3': '#FDE68A',
        '--glow-color-4': '#FBBF24',
    }
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
    colors: {
        '--border-color': '#22D3EE',
        '--box-shadow-color': '#06B6D4',
        '--glow-color-1': '#0891B2',
        '--glow-color-2': '#06B6D4',
        '--glow-color-3': '#A5F3FC',
        '--glow-color-4': '#67E8F9',
    }
  },
];


const FeatureCard = ({
  feature,
  index,
  progress,
  range,
}: {
  feature: (typeof features)[0];
  index: number;
  progress: any;
  range: [number, number];
}) => {
    
    const scale = useTransform(progress, range, [1, 0.9]);
    const contentOpacity = useTransform(progress, [range[0] + 0.05, range[1]], [1, 0]);
  
    return (
      <motion.div
        style={{
            scale,
            top: `calc(5% + ${index * 5}rem)`,
        }}
        className="sticky w-full h-screen flex items-center justify-center p-4"
      >
        <div 
          className="relative w-full max-w-4xl h-[75vh] rounded-3xl overflow-hidden electric-card"
          style={feature.colors as React.CSSProperties}
        >
          {/* This div holds the consistent background and blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-3xl"></div>
          
          <motion.div 
            className="w-full h-full p-8 md:p-12 lg:p-16 flex flex-col md:flex-row md:items-start md:pt-20 gap-8 lg:gap-16"
            style={{ opacity: contentOpacity }}
          >
                {/* Left Side - Text Content */}
                <div className="md:w-1/2 text-center md:text-left relative z-10">
                    <div className="inline-block bg-white/10 p-3 rounded-xl mb-4 text-2xl">{feature.icon}</div>
                    <h2 className="text-2xl lg:text-3xl font-bold font-headline text-white mb-4">{feature.title}</h2>
                    <p className="text-sm lg:text-base text-white/70 mb-6">{feature.description}</p>
                    <ul className="space-y-3">
                        {feature.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-white/80">{point}</span>
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
                    feature={feature}
                    progress={scrollYProgress}
                    range={[start, end]}
                />
            );
        })}
    </div>
  );
}
