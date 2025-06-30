
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Bot, Calendar, Target, Brain } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const LandingHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-background/30 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            <h1 className="font-headline text-2xl font-semibold text-white">FutureSight</h1>
        </Link>
        <div className="space-x-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/auth/signin">Login</Link>
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/auth/signup">Sign Up Free</Link>
            </Button>
        </div>
    </header>
);

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
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // This client-side redirect is a fallback for the middleware.
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    // If the user is logged in, we render a spinner while the redirect happens.
    // This prevents flashing the landing page.
    // For anonymous users, user is null, so this won't render.
    if (loading || user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-900">
                <LoadingSpinner size="lg" />
            </div>
        );
    }
    
    return (
        <div className="bg-background text-foreground">
            <LandingHeader />

            <main>
                {/* Hero Section */}
                <section className="relative h-screen flex items-center justify-center text-center p-4">
                    <div className="absolute inset-0 bg-black/60 z-10"></div>
                    <Image src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop"
                           alt="Cosmic background" layout="fill" objectFit="cover" className="z-0" data-ai-hint="cosmic nebula"/>
                    <div className="z-20 relative max-w-4xl">
                        <h1 className="text-5xl md:text-7xl font-bold font-headline text-white leading-tight">Chart Your Future. Master Your Present.</h1>
                        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                            FutureSight is your AI-powered copilot for career and academic excellence. Turn aspirations into actionable plans, optimize your daily schedule, and unlock your full potential.
                        </p>
                        <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10 rounded-full">
                            <Link href="/auth/signup">Start Your Journey Free <ArrowRight className="ml-2 h-5 w-5"/></Link>
                        </Button>
                    </div>
                </section>

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
                
                 {/* Final CTA */}
                <section className="relative py-20 md:py-32 text-center p-4 bg-gray-900">
                     <Image src="https://images.unsplash.com/photo-1554147090-e1221a04a062?q=80&w=2070&auto=format&fit=crop"
                           alt="Abstract colorful background" layout="fill" objectFit="cover" className="z-0 opacity-30" data-ai-hint="abstract colorful"/>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold font-headline text-white">Ready to Engineer Your Future?</h2>
                        <p className="mt-4 text-lg text-gray-300 max-w-xl mx-auto">Join thousands of students and professionals who are taking control of their careers with AI.</p>
                         <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10 rounded-full">
                            <Link href="/auth/signup">Claim Your Free Account <ArrowRight className="ml-2 h-5 w-5"/></Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="bg-gray-900 border-t border-border/20 p-8 text-center text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} FutureSight by H Stream. All rights reserved.</p>
                <div className="mt-4 space-x-4">
                    <Link href="#" className="hover:text-primary">Terms of Service</Link>
                    <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                </div>
            </footer>
        </div>
    );
}
