
'use client';

import Link from 'next/link';
import StarryBackground from '@/components/landing/StarryBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Bot, Calendar, Target, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingHeader } from '@/components/layout/LandingHeader';

const ParallaxSection = ({ imageUrl, children, className, hint }: { imageUrl: string, children: React.ReactNode, className?: string, hint?: string }) => (
    <div
        className={cn("min-h-screen bg-cover bg-fixed bg-center", className)}
        style={{ backgroundImage: `url(${imageUrl})` }}
        data-ai-hint={hint}
    >
        {children}
    </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <Card className="frosted-glass w-full max-w-lg shadow-2xl border-purple-400/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
                <Icon className="h-8 w-8 text-accent"/>
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-foreground/80">{description}</p>
        </CardContent>
    </Card>
);

export default function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <LandingHeader />

            <main>
                {/* Hero Section */}
                <section className="gravity-background relative h-screen flex items-center justify-center text-center p-4 overflow-hidden">
                    <StarryBackground layer="small" />
                    <StarryBackground layer="medium" />
                    <StarryBackground layer="large" />

                    <div className="gravity-horizon">
                        <div className="gravity-horizon-glow-4"></div>
                        <div className="gravity-horizon-glow-1"></div>
                        <div className="gravity-horizon-glow-2"></div>
                        <div className="gravity-horizon-glow-3"></div>
                    </div>
                    <div className="gravity-earth">
                        <div className="gravity-earth-shine"></div>
                    </div>

                    <div className="relative z-10 max-w-4xl">
                        <h1 className="text-5xl md:text-7xl font-bold font-headline text-white leading-tight">Chart Your Future. Master Your Present.</h1>
                        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                            FutureSight is your AI-powered copilot for career and academic excellence. Turn aspirations into actionable plans, optimize your daily schedule, and unlock your full potential.
                        </p>
                        <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10 rounded-full">
                            <Link href="/auth/signup">Start Your Journey Free <ArrowRight className="ml-2 h-5 w-5"/></Link>
                        </Button>
                    </div>
                </section>

                <div id="features">
                    {/* Parallax Feature 1: AI Vision */}
                    <ParallaxSection imageUrl="https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?q=80&w=2070&auto=format&fit=crop" hint="desk space">
                        <div className="min-h-screen flex items-center justify-start p-8 md:p-16 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
                            <FeatureCard 
                                icon={Bot} 
                                title="AI-Powered Career Vision"
                                description="Don't just dream about your future—build it. Describe your passions and our AI will generate a comprehensive career vision, complete with strengths, development areas, and an actionable roadmap to get you started."
                            />
                        </div>
                    </ParallaxSection>
                    
                    {/* Parallax Feature 2: Timeline */}
                    <ParallaxSection imageUrl="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" hint="earth space">
                         <div className="min-h-screen flex items-center justify-end p-8 md:p-16 bg-gradient-to-l from-black/70 via-black/50 to-transparent">
                            <FeatureCard 
                                icon={Calendar} 
                                title="Intelligent Timeline & Sync"
                                description="Connect your Google Calendar and watch as FutureSight's AI processes your events, tasks, and even important emails, integrating them into a unified, intelligent timeline. Never miss a deadline or opportunity again."
                            />
                        </div>
                    </ParallaxSection>
                    
                    {/* Parallax Feature 3: Skills & Resources */}
                    <ParallaxSection imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" hint="team working">
                         <div className="min-h-screen flex items-center justify-start p-8 md:p-16 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
                            <FeatureCard 
                                icon={Brain} 
                                title="Skills Hub & Resource Discovery"
                                description="Track your skill progression across various domains. Our AI analyzes your goals and existing skills to suggest hyper-relevant learning resources—books, courses, and tools—to accelerate your growth."
                            />
                        </div>
                    </ParallaxSection>
                </div>
                
                 {/* Final CTA */}
                <section id="pricing" className="relative py-20 md:py-32 text-center p-4 bg-gray-900">
                     <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: "url('https://images.unsplash.com/photo-1554147090-e1221a04a062?q=80&w=2070&auto=format&fit=crop')"}} data-ai-hint="abstract colorful"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold font-headline text-white">Ready to Engineer Your Future?</h2>
                        <p className="mt-4 text-lg text-gray-300 max-w-xl mx-auto">Join thousands of students and professionals who are taking control of their careers with AI.</p>
                         <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10 rounded-full">
                            <Link href="/auth/signup">Claim Your Free Account <ArrowRight className="ml-2 h-5 w-5"/></Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer id="contact" className="bg-gray-900 border-t border-border/20 p-8 text-center text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} FutureSight by H Stream. All rights reserved.</p>
                <div className="mt-4 space-x-4">
                    <Link href="#" className="hover:text-primary">Terms of Service</Link>
                    <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                </div>
            </footer>
        </div>
    );
}
