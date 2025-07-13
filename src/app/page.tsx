
'use client';

import CursorArrow from '@/components/landing/CursorArrow';
import StarryBackground from '@/components/landing/StarryBackground';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { CalendarAiLogo } from '@/components/logo/CalendarAiLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, Bot, Brain, Calendar, Check, Github, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Define a structure for currency data
interface Currency {
    code: string;
    symbol: string;
    rate: number; // Rate to convert from INR
}

// Hardcoded exchange rates for major currencies.
const SUPPORTED_CURRENCIES: Currency[] = [
    { code: 'INR', symbol: '₹', rate: 1 },
    { code: 'USD', symbol: '$', rate: 1 / 83 },
    { code: 'EUR', symbol: '€', rate: 1 / 90 },
    { code: 'GBP', symbol: '£', rate: 1 / 105 },
];

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

const PricingCard = ({ title, price, currencySymbol, period, features, popular = false, isLoading = false }: { title: string, price: string, currencySymbol: string, period: string, features: string[], popular?: boolean, isLoading?: boolean }) => (
    <Card className={cn(
        "frosted-glass w-full max-w-sm p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2",
        popular ? "border-2 border-accent shadow-accent/20 shadow-lg" : "border-border/30"
    )}>
        {popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"><Badge className="bg-accent text-accent-foreground text-sm">Best Value</Badge></div>}
        <CardHeader className="text-center p-0">
            <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
            <div className="mt-2 h-10 flex items-center justify-center">
                {isLoading ? (
                    <div className="h-9 w-28 bg-gray-700/50 animate-pulse rounded-md" />
                ) : (
                    <p>
                        <span className="text-4xl font-extrabold text-white">{currencySymbol}{price}</span>
                        <span className="text-muted-foreground">{period}</span>
                    </p>
                )}
            </div>
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
    const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
    const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);

    useEffect(() => {
        const fetchCurrency = async () => {
            setIsCurrencyLoading(true);
            try {
                const response = await fetch('https://ip-api.com/json/?fields=currency');
                if (!response.ok) throw new Error('Failed to fetch geo-location');
                const data = await response.json();
                const userCurrencyCode = data.currency;

                const foundCurrency = SUPPORTED_CURRENCIES.find(c => c.code === userCurrencyCode);
                if (foundCurrency) {
                    setCurrency(foundCurrency);
                }
            } catch (error) {
                console.warn("Could not detect currency, defaulting to INR.", error);
                setCurrency(SUPPORTED_CURRENCIES[0]);
            } finally {
                setIsCurrencyLoading(false);
            }
        };
        fetchCurrency();
    }, []);

    const convertAndFormatPrice = (priceInr: number) => {
        if (currency.code === 'INR') {
            return priceInr.toString();
        }
        const converted = priceInr * currency.rate;
        const rounded = Math.ceil(converted) - 0.01;
        return rounded.toFixed(2);
    };

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
                        <h1 className="text-5xl md:text-7xl font-bold font-headline text-white leading-tight">Your Calendar, Reimagined.</h1>
                        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                            Career Calender is your intelligent assistant for perfect organization. Sync your life, generate smart daily plans, and achieve your goals with the power of AI.
                        </p>
                        <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10 rounded-full">
                            <Link href="/auth/signup" ref={ctaButtonRef}>Get Started For Free <ArrowRight className="ml-2 h-5 w-5"/></Link>
                        </Button>
                    </div>
                </section>
                
                {/* Wrapper for sections with shared background */}
                <div 
                    className="relative bg-cover bg-center bg-fixed"
                    style={{backgroundImage: "url('https://lolstatic-a.akamaihd.net/frontpage/apps/prod/preseason-2018/pt_BR/a6708b7ae3dbc0b25463f9c8e259a513d2c4c7e6/assets/img/global/level-bg-top.jpg')"}}
                    data-ai-hint="fantasy landscape"
                >
                    <div className="absolute inset-0 bg-black/60"></div> {/* Dark overlay for readability */}

                    {/* Features Section */}
                    <section id="features" className="py-20 md:py-32 relative z-10">
                        <div className="container mx-auto px-4">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-4xl md:text-5xl font-bold font-headline text-primary">A Glimpse Into Your Future</h2>
                                <p className="mt-4 text-lg text-foreground/80">
                                    Career Calender combines powerful AI with intuitive planning tools to give you unparalleled clarity on your life.
                                </p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-8">
                                <FeatureCard
                                    icon={Calendar}
                                    title="Intelligent Sync"
                                    description="Connect Google Calendar, Tasks, and Gmail. Career Calender processes everything into one unified, smart timeline."
                                />
                                <FeatureCard
                                    icon={Bot}
                                    title="Smart Daily Planning"
                                    description="Let our AI analyze your schedule, goals, and even emails to generate the perfect plan for your day."
                                />
                                <FeatureCard
                                    icon={Brain}
                                    title="AI-Powered Insights"
                                    description="From summarizing important emails to suggesting resources, get AI assistance that helps you stay ahead."
                                />
                            </div>
                        </div>
                    </section>
                    
                    {/* Pricing Section */}
                    <section id="pricing" className="py-20 md:py-32 relative z-10">
                        <div className="container mx-auto px-4">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-4xl md:text-5xl font-bold font-headline text-white">Choose Your Plan</h2>
                                <p className="mt-4 text-lg text-gray-200">
                                    Start for free, then unlock the full power of Career Calender with a plan that fits your journey.
                                </p>
                            </div>
                            <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
                                <PricingCard
                                    isLoading={isCurrencyLoading}
                                    title="Monthly"
                                    price={convertAndFormatPrice(59)}
                                    currencySymbol={currency.symbol}
                                    period="/month"
                                    features={[
                                        'Access to all AI features',
                                        'Unlimited timeline events',
                                        'Personalized news feed',
                                        'Email support'
                                    ]}
                                />
                                <PricingCard
                                    isLoading={isCurrencyLoading}
                                    popular
                                    title="Yearly"
                                    price={convertAndFormatPrice(599)}
                                    currencySymbol={currency.symbol}
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

                    {/* Footer */}
                    <footer id="contact" className="relative z-10 bg-transparent border-t border-border/20 text-muted-foreground">
                        <div className="container mx-auto px-4 py-16">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                                <div className="col-span-1 md:col-span-2">
                                    <Link href="/" className="flex items-center gap-2 mb-4">
                                        <CalendarAiLogo />
                                        <h1 className="font-headline text-2xl font-semibold text-white">Career Calender</h1>
                                    </Link>
                                    <p className="max-w-md text-sm text-foreground/60">Your AI-powered assistant for calendar and life organization. Turn aspirations into actionable plans and unlock your full potential.</p>
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
                                <p className="text-sm">&copy; {new Date().getFullYear()} Career Calender. All rights reserved.</p>
                                <div className="flex gap-4 mt-4 sm:mt-0">
                                    <Link href="#" className="hover:text-primary transition-colors"><Github className="h-5 w-5" /></Link>
                                    <Link href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                                    <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
