
'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Bot, Calendar, Brain, Check, Github, Twitter, Linkedin, LayoutGrid, Flame, Apple, GraduationCap, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingHeader } from '@/components/layout/LandingHeader';
import StarryBackground from '@/components/landing/StarryBackground';
import { Badge } from '@/components/ui/badge';
import CursorArrow from '@/components/landing/CursorArrow';
import { CalendarAiLogo } from '@/components/logo/CalendarAiLogo';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import GravityWellBackground from '@/components/landing/GravityWellBackground';
import LandingPageChat from '@/components/landing/LandingPageChat';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ScrollingFeatureShowcase from '@/components/landing/ScrollingFeatureShowcase';


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

const plans = {
    student: {
        monthly: {
            id: 'student_monthly',
            title: 'Monthly',
            priceINR: 59,
            priceSuffix: '/ month',
            features: ['All AI Features', 'Timeline & Goal Tracking', 'Codefolio Ally Plugin', 'Community Access'],
        },
        yearly: {
            id: 'student_yearly',
            title: 'Yearly',
            priceINR: 599,
            priceSuffix: '/ year',
            features: ['Everything in Monthly', 'Save 20% Annually', 'Priority Email Support', 'Early Access to New Plugins'],
        }
    },
    professional: {
        monthly: {
            id: 'professional_monthly',
            title: 'Monthly Pro',
            priceINR: 999,
            priceSuffix: '/ month',
            features: ['AI Meeting Assistant', 'Advanced Project Sync', 'Focus Time Automation', 'Team Collaboration (Beta)'],
        },
        yearly: {
            id: 'professional_yearly',
            title: 'Yearly Pro',
            priceINR: 6999,
            priceSuffix: '/ year',
            features: ['Everything in Monthly Pro', 'Save 20% Annually', '24/7 Dedicated Support', 'API Access (Coming Soon)'],
        }
    }
};


const PricingCard = ({ title, price, currencySymbol, period, features, popular = false, isLoading = false }: { title: string, price: string, currencySymbol: string, period: string, features: string[], popular?: boolean, isLoading?: boolean }) => (
    <Card className={cn(
        "frosted-glass w-full max-w-sm p-4 flex flex-col transition-all duration-300",
        popular ? "border-2 border-accent shadow-accent/20 shadow-lg" : "border-border/30 bg-card/70"
    )}>
        {popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"><Badge className="bg-accent text-accent-foreground text-xs">Best Value</Badge></div>}
        <CardHeader className="text-center p-0">
            <CardTitle className="text-md font-bold text-primary">{title}</CardTitle>
            <div className="mt-2 h-8 flex items-center justify-center">
                {isLoading ? (
                    <div className="h-8 w-20 bg-gray-700/50 animate-pulse rounded-md" />
                ) : (
                    <p>
                        <span className="text-xl font-extrabold text-white">{currencySymbol}{price}</span>
                        <span className="text-xs text-muted-foreground">{period}</span>
                    </p>
                )}
            </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 mt-4">
            <ul className="space-y-2">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-left">
                        <Check className="h-4 w-4 text-green-400 shrink-0"/>
                        <span className="text-xs text-foreground/90">{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter className="p-0 mt-4">
            <Button asChild size="sm" className={cn("w-full h-8", popular ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90")}>
                <Link href="/auth/signup">Subscribe</Link>
            </Button>
        </CardFooter>
    </Card>
);


const PlanSection = ({ type, icon: Icon, description, plans, currency, isLoading }: { type: string, icon: React.ElementType, description: string, plans: any, currency: Currency, isLoading: boolean }) => {
    const [isYearly, setIsYearly] = useState(false);
    
    const convertAndFormatPrice = (priceInr: number) => {
        if (currency.code === 'INR') {
            return priceInr.toString();
        }
        const converted = priceInr * currency.rate;
        const rounded = Math.ceil(converted) - 0.01;
        return rounded.toFixed(2);
    };

    const displayPlan = isYearly ? plans.yearly : plans.monthly;

    return (
         <Card className="frosted-glass p-4 md:p-6 relative overflow-hidden w-full max-w-md">
            <div className="absolute top-4 right-4 h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Icon className="h-6 w-6 text-accent"/>
            </div>
            <div className="mb-4">
                <h2 className="text-xl font-bold font-headline text-white">{type}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{description}</p>
            </div>

             <div className="flex items-center justify-center gap-3 mb-4">
                <Label htmlFor={`${type}-toggle`} className={cn("font-medium text-xs", !isYearly ? "text-primary" : "text-muted-foreground")}>Monthly</Label>
                <Switch
                    id={`${type}-toggle`}
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                    aria-label="Toggle billing period"
                />
                <Label htmlFor={`${type}-toggle`} className={cn("font-medium text-xs", isYearly ? "text-primary" : "text-muted-foreground")}>Yearly</Label>
            </div>
            
            <div className="mx-auto flex justify-center">
                 <PricingCard
                    title={displayPlan.title}
                    price={convertAndFormatPrice(displayPlan.priceINR)}
                    currencySymbol={currency.symbol}
                    period={displayPlan.priceSuffix}
                    features={displayPlan.features}
                    popular={isYearly}
                    isLoading={isLoading}
                />
            </div>
        </Card>
    )
};


const AndroidIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M4 14V12C4 8.68629 6.68629 6 10 6H14C17.3137 6 20 8.68629 20 12V14M4 14H20M4 14H5M20 14H19M15 9.5C15 9.22386 14.7761 9 14.5 9C14.2239 9 14 9.22386 14 9.5V10.5C14 10.7761 14.2239 11 14.5 11C14.7761 11 15 10.7761 15 10.5V9.5ZM10 9.5C10 9.22386 9.77614 9 9.5 9C9.22386 9 9 9.22386 9 9.5V10.5C9 10.7761 9.22386 11 9.5 11C9.77614 11 10 10.7761 10 10.5V9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 14L3 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.5 14L21 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const GooglePlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M4.68359 2.0332L14.6146 11.9642L4.68359 21.8951C4.30571 22.273 3.67324 22.273 3.29536 21.8951C2.91748 21.5173 2.91748 20.8848 3.29536 20.5069L10.8385 12.9638C11.2163 12.586 11.2163 11.9535 10.8385 11.5756L3.29536 4.03243C2.91748 3.65455 2.91748 3.02208 3.29536 2.6442C3.67324 2.26632 4.30571 2.26632 4.68359 2.0332Z" fill="#00E5FF"/>
        <path d="M19.5298 10.579L5.43896 2.0332L15.3699 11.9642L19.5298 14.1205C20.3544 13.7082 20.3544 12.4414 19.5298 12.0292L19.5298 10.579Z" fill="#FFC107"/>
        <path d="M19.5298 14.1205L15.3699 11.9642L5.43896 21.8951L19.5298 13.3494C20.3544 12.9372 20.3544 11.6704 19.5298 11.2581L19.5298 14.1205Z" fill="#FF3D00"/>
        <path d="M4.68359 2.0332L5.43896 2.0332L19.5298 10.579V13.3494C20.3544 12.9372 20.3544 11.6704 19.5298 11.2581L4.68359 2.0332Z" fill="#4CAF50"/>
    </svg>
);


export default function LandingPage() {
    const ctaButtonRef = useRef<HTMLAnchorElement>(null);
    const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
    const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);

    useEffect(() => {
        setIsCurrencyLoading(true);
        const fetchCurrency = async () => {
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

    return (
        <div className="bg-background text-foreground">
            <LandingHeader />
            <CursorArrow targetRef={ctaButtonRef} />
            <LandingPageChat />

            <main>
                {/* Hero Section */}
                <section className="relative h-screen flex items-center justify-center text-center p-4 overflow-hidden">
                    <StarryBackground layer="small" />
                    <StarryBackground layer="medium" />
                    <StarryBackground layer="large" />
                    <div className="absolute inset-0 bg-black/30"></div>

                    <div className="relative z-10 max-w-4xl">
                        <h1 className="text-5xl md:text-7xl font-bold font-headline text-white leading-tight">Your Calendar, Reimagined.</h1>
                        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                            Calendar.ai is your intelligent assistant for perfect organization. Sync your life, generate smart daily plans, and achieve your goals with the power of AI.
                        </p>
                        <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10 rounded-full">
                            <Link href="/auth/signup" ref={ctaButtonRef}>Get Started For Free <ArrowRight className="ml-2 h-5 w-5"/></Link>
                        </Button>
                        <p className="mt-4 text-sm text-gray-300">More reliable -&gt; less efforts -&gt; within no time.</p>
                    </div>
                </section>
                
                <div 
                    className="relative bg-cover bg-center bg-fixed"
                    style={{backgroundImage: "url('https://lolstatic-a.akamaihd.net/frontpage/apps/prod/preseason-2018/pt_BR/a6708b7ae3dbc0b25463f9c8e259a513d2c4c7e6/assets/img/global/level-bg-top.jpg')"}}
                    data-ai-hint="fantasy landscape"
                >
                    <div className="absolute inset-0 bg-black/30"></div>
                    
                    <FeatureShowcase />

                    <ScrollingFeatureShowcase />
                    
                     {/* New Pricing Section */}
                    <section id="pricing" className="py-20 md:py-32 relative z-10">
                         <div className="container mx-auto px-4">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-4xl md:text-5xl font-bold font-headline text-white">Choose Your Plan</h2>
                                <p className="mt-4 text-lg text-gray-200">
                                    Start for free, then unlock the full power of Calendar.ai with a plan that fits your journey.
                                </p>
                            </div>
                            <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
                               <PlanSection 
                                    type="Student Plans" 
                                    icon={GraduationCap} 
                                    description="For ambitious students looking to get ahead."
                                    plans={plans.student} 
                                    currency={currency}
                                    isLoading={isCurrencyLoading}
                                />
                                <PlanSection 
                                    type="Professional Plans" 
                                    icon={Briefcase} 
                                    description="For career-focused individuals and teams."
                                    plans={plans.professional} 
                                    currency={currency}
                                    isLoading={isCurrencyLoading}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Download App Section */}
                    <section className="relative py-24 md:py-40">
                        <GravityWellBackground />
                        <div className="relative z-10 container mx-auto px-4 text-center">
                             <h2 className="text-4xl md:text-5xl font-bold font-headline text-white">Download our app</h2>
                             <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">
                                Get the full Calendar.ai experience on your mobile device. Stay organized on the go.
                             </p>
                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                 <div className="flex flex-col items-center justify-between gap-6 p-8 bg-black/20 rounded-2xl border border-white/10">
                                     <div className="flex flex-col items-center gap-4">
                                         <Apple className="h-16 w-16 text-white"/>
                                         <div className="flex items-center gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black"><p className="text-xl font-bold">A</p></div>
                                            <p className="text-lg font-semibold text-white">iOS</p>
                                         </div>
                                     </div>
                                     <div className="p-1 rounded-md bg-gradient-to-r from-green-400 to-blue-500">
                                        <div className="px-8 py-2 bg-gray-900 rounded-sm">
                                             <span className="text-white">Coming Soon...</span>
                                        </div>
                                     </div>
                                 </div>
                                 <div className="flex flex-col items-center justify-between gap-6 p-8 bg-black/20 rounded-2xl border border-white/10">
                                     <div className="flex flex-col items-center gap-4">
                                         <AndroidIcon className="h-16 w-16 text-green-400" />
                                         <div className="flex items-center gap-3">
                                             <GooglePlayIcon className="h-8 w-8"/>
                                             <span className="text-2xl font-semibold text-white">android</span>
                                         </div>
                                     </div>
                                      <a href="#" className="p-1 rounded-md bg-gradient-to-r from-green-400 to-blue-500 hover:opacity-90 transition-opacity">
                                        <div className="px-6 py-2 bg-gray-900 rounded-sm">
                                             <span className="text-white font-medium">Download For Android</span>
                                        </div>
                                     </a>
                                 </div>
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
                                        <h1 className="font-headline text-2xl font-semibold text-white">Calendar.ai</h1>
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
                                <p className="text-sm">&copy; {new Date().getFullYear()} Calendar.ai. All rights reserved.</p>
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
