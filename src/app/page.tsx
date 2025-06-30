
'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Bot, Calendar, Brain, Check, Github, Twitter, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingHeader } from '@/components/layout/LandingHeader';
import StarryBackground from '@/components/landing/StarryBackground';
import { Badge } from '@/components/ui/badge';
import CursorArrow from '@/components/landing/CursorArrow';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <Card className="frosted-glass text-center p-8 transition-all duration-300 hover:border-accent hover:-translate-y-2 bg-card/60">
        <div className="inline-block p-4 bg-accent/10 rounded-full mb-6">
            <Icon className="h-10 w-10 text-accent"/>
        </div>
        <CardHeader className="p-0">
            <CardTitle className="text-2xl font-bold text-primary mb-3">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <p className="text-foreground/80">{description}</p>
        </CardContent>
    </Card>
);

const PricingCard = ({ title, price, period, features, popular = false }: { title: string, price: string, period: string, features: string[], popular?: boolean }) => (
    <Card className={cn(
        "frosted-glass w-full max-w-sm p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2",
        popular ? "border-2 border-accent shadow-accent/20 shadow-lg" : "border-border/30"
    )}>
        {popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"><Badge className="bg-accent text-accent-foreground text-sm">Best Value</Badge></div>}
        <CardHeader className="text-center p-0">
            <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
            <p className="mt-2">
                <span className="text-4xl font-extrabold text-white">{price}</span>
                <span className="text-muted-foreground">{period}</span>
            </p>
        </CardHeader>
        <CardContent className="flex-1 p-0 mt-8">
            <ul className="space-y-4">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-left">
                        <Check className="h-5 w-5 text-green-400 shrink-0"/>
                        <span className="text-foreground/90">{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter className="p-0 mt-8">
            <Button asChild size="lg" className={cn("w-full text-lg", popular ? "bg-accent hover:bg-accent/90" : "bg-primary/80 hover:bg-primary")}>
                <Link href="/auth/signup">Get Started</Link>
            </Button>
        </CardFooter>
    </Card>
);


export default function LandingPage() {
    const ctaButtonRef = useRef<HTMLAnchorElement>(null);

    return (
        <div className="bg-background text-foreground">
            <LandingHeader />
            <CursorArrow targetRef={ctaButtonRef} />

            <main>
                {/* Hero Section */}
                <section className="gravity-background relative h-screen flex items-center justify-center text-center p-4 overflow-hidden">
                    <StarryBackground layer="small" />
                    <StarryBackground layer="medium" />
                    <StarryBackground layer="large" />
                    <div className="absolute inset-0 bg-black/30"></div>

                    <div className="gravity-horizon">
                         <div className="glow"></div>
                    </div>
                    <div className="earth">
                         <div className="earth-shine"></div>
                    </div>

                    <div className="relative z-10 max-w-4xl">
                        <h1 className="text-5xl md:text-7xl font-bold font-headline text-white leading-tight">Chart Your Future. Master Your Present.</h1>
                        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                            FutureSight is your AI-powered copilot for career and academic excellence. Turn aspirations into actionable plans, optimize your daily schedule, and unlock your full potential.
                        </p>
                        <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10 rounded-full">
                            <Link href="/auth/signup" ref={ctaButtonRef}>Start Your Journey Free <ArrowRight className="ml-2 h-5 w-5"/></Link>
                        </Button>
                    </div>
                </section>
                
                {/* Features Section */}
                <section id="features" className="py-20 md:py-32 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold font-headline text-primary">A Glimpse Into Your Future</h2>
                            <p className="mt-4 text-lg text-foreground/80">
                                FutureSight combines powerful AI with intuitive planning tools to give you unparalleled clarity on your career path.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={Bot}
                                title="AI-Powered Career Vision"
                                description="Describe your passions and our AI will generate a comprehensive career vision, complete with an actionable roadmap."
                            />
                            <FeatureCard
                                icon={Calendar}
                                title="Intelligent Timeline & Sync"
                                description="Connect your Google Calendar and watch as our AI processes your events, tasks, and emails into a unified, intelligent timeline."
                            />
                            <FeatureCard
                                icon={Brain}
                                title="Skills Hub & Resource Discovery"
                                description="Track your skill progression and get hyper-relevant learning resources—books, courses, and tools—to accelerate your growth."
                            />
                        </div>
                    </div>
                </section>
                
                {/* Pricing Section */}
                <section id="pricing" className="py-20 md:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center bg-fixed opacity-20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1554147090-e1221a04a062?q=80&w=2070&auto=format&fit=crop')"}} data-ai-hint="abstract colorful"></div>
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold font-headline text-white">Choose Your Plan</h2>
                            <p className="mt-4 text-lg text-gray-200">
                                Start for free, then unlock the full power of FutureSight with a plan that fits your journey.
                            </p>
                        </div>
                        <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
                            <PricingCard
                                title="Monthly"
                                price="₹59"
                                period="/month"
                                features={[
                                    'Access to all AI features',
                                    'Unlimited timeline events',
                                    'Personalized news feed',
                                    'Email support'
                                ]}
                            />
                            <PricingCard
                                popular
                                title="Yearly"
                                price="₹599"
                                period="/year"
                                features={[
                                    'All features from Monthly',
                                    'Save 20% with annual billing',
                                    'Priority support',
                                    'Early access to new features'
                                ]}
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer id="contact" className="bg-gray-900 border-t border-border/20 text-muted-foreground">
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="col-span-1 md:col-span-2">
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                                <h1 className="font-headline text-2xl font-semibold text-white">FutureSight</h1>
                            </Link>
                            <p className="max-w-md text-sm text-foreground/60">Your AI-powered copilot for career and academic excellence. Turn aspirations into actionable plans and unlock your full potential.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Links</h4>
                            <ul className="space-y-3">
                                <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                                <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                                <li><Link href="/auth/signin" className="hover:text-primary transition-colors">Login</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                            <ul className="space-y-3">
                                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-16 pt-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center">
                        <p className="text-sm">&copy; {new Date().getFullYear()} FutureSight by H Stream. All rights reserved.</p>
                        <div className="flex gap-4 mt-4 sm:mt-0">
                            <Link href="#" className="hover:text-primary transition-colors"><Github className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
