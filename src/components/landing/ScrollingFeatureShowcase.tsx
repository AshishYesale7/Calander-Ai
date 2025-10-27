
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import CustomVideoPlayer from './CustomVideoPlayer';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


const studentFeatures = [
  {
    title: 'AI-Powered Daily Planning',
    description: 'Calendar.ai intelligently crafts your daily schedule, balancing coursework, career prep, and personal growth to keep you on track.',
    points: [
      'Personalized schedules based on your goals.',
      'Adapts to your fixed classes and appointments.',
      'Ensures consistent progress on long-term objectives.',
    ],
    videoUrl: 'https://assets.codepen.io/3364143/7btrrd.mp4',
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
    videoUrl: 'https://assets.codepen.io/3364143/7btrrd.mp4',
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
];

const professionalFeatures = [
    {
        title: 'AI Meeting Assistant',
        description: 'Get automated summaries and action items from your meetings, ensuring nothing falls through the cracks.',
        points: [
            'Real-time transcription and speaker identification.',
            'AI-generated summaries focusing on decisions and outcomes.',
            'Automatic creation of tasks in your project management tools.',
        ],
        videoUrl: 'https://assets.codepen.io/3364143/7btrrd.mp4',
        icon: '🤖',
        colors: {
            '--border-color': '#60A5FA',
            '--box-shadow-color': '#3B82F6',
            '--glow-color-1': '#2563EB',
            '--glow-color-2': '#3B82F6',
            '--glow-color-3': '#BFDBFE',
            '--glow-color-4': '#93C5FD',
        }
    },
    {
        title: 'Team Productivity Dashboards',
        description: 'Visualize team workload, identify bottlenecks, and ensure projects stay on track with insightful analytics.',
        points: [
            'Track time spent in meetings vs. deep work.',
            'Analyze project progress against your calendar.',
            'Get insights to optimize team collaboration.',
        ],
        videoUrl: 'https://assets.codepen.io/3364143/7btrrd.mp4',
        icon: '📊',
        colors: {
            '--border-color': '#34D399',
            '--box-shadow-color': '#10B981',
            '--glow-color-1': '#059669',
            '--glow-color-2': '#10B981',
            '--glow-color-3': '#A7F3D0',
            '--glow-color-4': '#6EE7B7',
        }
    },
];


const FeatureCard = ({
  feature,
  index,
  progress,
  range,
  total,
}: {
  feature: (typeof studentFeatures)[0];
  index: number;
  progress: any;
  range: [number, number];
  total: number;
}) => {
    
    const scale = useTransform(progress, range, [1, 0.9]);
    const glowOpacity = useTransform(progress, range, [1, 0]);
    const cardOffset = total > 2 ? 5 : 10;

    return (
      <motion.div
        style={{
            scale,
            top: `calc(5% + ${index * cardOffset}rem)`,
        }}
        className="sticky w-full h-screen flex items-center justify-center p-4"
      >
        <div 
          className="relative w-full max-w-4xl h-[75vh] rounded-3xl overflow-hidden electric-card"
          style={feature.colors as React.CSSProperties}
        >
          {/* This div holds the consistent background and blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-3xl"></div>
          <div 
            className="w-full h-full p-8 md:p-12 lg:p-16 flex flex-col md:flex-row md:items-start md:pt-20 gap-8 lg:gap-16"
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
                         <CustomVideoPlayer 
                            src={feature.videoUrl} 
                            title="Calendar.ai"
                            description="Feature Preview"
                            logoComponent={<CalendarAiLogo className="w-20 h-auto" />}
                          />
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    );
};

const FeatureList = ({ features }: { features: typeof studentFeatures | typeof professionalFeatures }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ['start start', 'end end'],
    });

    return (
        <div ref={containerRef} className="relative" style={{ height: `${features.length * 100}vh` }}>
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
                        total={total}
                    />
                );
            })}
        </div>
    );
};

export default function ScrollingFeatureShowcase() {
  return (
    <section id="features" className="relative z-10 my-24">
       <Tabs defaultValue="student">
          <div className="flex justify-center mb-16 sticky top-20 z-20">
              <TabsList className="bg-muted p-2 border border-border/30 h-auto">
                  <TabsTrigger value="student" className="px-8 py-2 text-base">For Students</TabsTrigger>
                  <TabsTrigger value="professional" className="px-8 py-2 text-base">For Professionals</TabsTrigger>
              </TabsList>
          </div>

          <TabsContent value="student">
            <FeatureList features={studentFeatures} />
          </TabsContent>
          <TabsContent value="professional">
             <FeatureList features={professionalFeatures} />
          </TabsContent>
      </Tabs>
    </section>
  );
}
