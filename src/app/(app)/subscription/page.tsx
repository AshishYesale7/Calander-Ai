
'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, Crown, GraduationCap, Briefcase, Switch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';


// Define a structure for currency data
interface Currency {
    code: string;
    symbol: string;
    rate: number; // Rate to convert from INR
}

// Hardcoded exchange rates for major currencies. In a real-world scenario, this would be fetched from a live API.
const SUPPORTED_CURRENCIES: Currency[] = [
    { code: 'INR', symbol: '₹', rate: 1 },
    { code: 'USD', symbol: '$', rate: 1 / 83 }, // 1 USD = 83 INR
    { code: 'EUR', symbol: '€', rate: 1 / 90 }, // 1 EUR = 90 INR
    { code: 'GBP', symbol: '£', rate: 1 / 105 }, // 1 GBP = 105 INR
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
            features: ['Everything in Monthly', 'Save 20% Annually', 'Priority Email Support', 'Early Access to Plugins'],
        }
    },
    professional: {
        monthly: {
            id: 'professional_monthly',
            title: 'Monthly Pro',
            priceINR: 149,
            priceSuffix: '/ month',
            features: ['All AI Features', 'Advanced Project Sync', 'Team Collaboration (Beta)', 'Priority Email Support'],
        },
        yearly: {
            id: 'professional_yearly',
            title: 'Yearly Pro',
            priceINR: 1499,
            priceSuffix: '/ year',
            features: ['Everything in Monthly Pro', 'Save 20% Annually', '24/7 Dedicated Support', 'API Access (Coming Soon)'],
        }
    }
};

type PlanID = 'student_monthly' | 'student_yearly' | 'professional_monthly' | 'professional_yearly';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PriceDisplay = ({ priceInr, currency }: { priceInr: number, currency: Currency }) => {
    const convertAndFormatPrice = (priceInr: number) => {
        if (currency.code === 'INR') {
            return priceInr.toString();
        }
        const converted = priceInr * currency.rate;
        const rounded = Math.ceil(converted) - 0.01;
        return rounded.toFixed(2);
    };

    return <span className="text-3xl font-bold text-foreground">{currency.symbol}{convertAndFormatPrice(priceInr)}</span>;
};


const PricingCard = ({ plan, currency, isLoading, currentPlanId, onSubscribe }: { plan: any, currency: Currency, isLoading: boolean, currentPlanId: PlanID | null, onSubscribe: () => void }) => (
    <Card className={cn("frosted-glass w-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
        plan.id.includes('yearly') ? "border-accent shadow-accent/10" : "border-border/30"
    )}>
        {plan.id.includes('yearly') && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"><Badge className="bg-accent text-accent-foreground text-sm">Best Value</Badge></div>}
        <CardHeader className="text-center p-6">
            <CardTitle className="text-xl font-bold text-primary">{plan.title}</CardTitle>
            <div className="mt-2 h-10 flex items-center justify-center">
                <PriceDisplay priceInr={plan.priceINR} currency={currency} />
                <span className="text-muted-foreground ml-1.5">{plan.priceSuffix}</span>
            </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 pt-0">
            <ul className="space-y-3 text-sm">
                {plan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 shrink-0"/>
                        <span className="text-foreground/90">{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter className="p-6 pt-0">
            <Button
                onClick={onSubscribe}
                disabled={isLoading || currentPlanId === plan.id}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
                {isLoading && currentPlanId === plan.id ? <LoadingSpinner size="sm" /> : 'Subscribe'}
            </Button>
        </CardFooter>
    </Card>
);

const PlanSection = ({ type, icon: Icon, plans, currency, isLoading, onSubscribe }: { type: string, icon: React.ElementType, plans: any, currency: Currency, isLoading: PlanID | null, onSubscribe: (planId: PlanID) => void }) => {
    const [isYearly, setIsYearly] = useState(false);
    const plan = isYearly ? plans.yearly : plans.monthly;

    return (
         <Card className="frosted-glass p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                <Icon className="h-8 w-8 text-accent"/>
            </div>
            <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary">{type} Plans</h2>
                <p className="text-muted-foreground mt-1">For ambitious {type.toLowerCase()}s looking to get ahead.</p>
            </div>

             <div className="flex items-center justify-center gap-4 mb-8">
                <span className={cn("font-medium", !isYearly ? "text-primary" : "text-muted-foreground")}>Monthly</span>
                <ShadcnSwitch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                    aria-label="Toggle billing period"
                />
                <span className={cn("font-medium", isYearly ? "text-primary" : "text-muted-foreground")}>Yearly</span>
            </div>
            
            <div className="max-w-sm mx-auto">
                 <PricingCard
                    plan={plan}
                    currency={currency}
                    isLoading={isLoading === plan.id}
                    currentPlanId={isLoading}
                    onSubscribe={() => onSubscribe(plan.id)}
                />
            </div>
        </Card>
    )
};


export default function SubscriptionPage() {
    const { user, refreshSubscription } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<PlanID | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]); // Default to INR
    const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);

    // Fetch user's currency based on IP address
    useEffect(() => {
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
                console.warn("Could not detect user's currency, defaulting to INR.", error);
                setCurrency(SUPPORTED_CURRENCIES[0]);
            } finally {
                setIsCurrencyLoading(false);
            }
        };

        fetchCurrency();
    }, []);
    
    const handleSubscribe = async (planId: PlanID) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to subscribe.', variant: 'destructive' });
            return;
        }

        if (!isScriptLoaded || isCurrencyLoading) {
            toast({ title: 'Payment Service Unavailable', description: 'Please wait a moment and try again.', variant: 'destructive' });
            return;
        }
        
        setIsLoading(planId);

        try {
            const res = await fetch('/api/payment/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create subscription.');
            }
            
            const currentPlan = planId.includes('student')
                ? (planId.includes('monthly') ? plans.student.monthly : plans.student.yearly)
                : (planId.includes('monthly') ? plans.professional.monthly : plans.professional.yearly);


            const options = {
                key: data.key_id,
                subscription_id: data.subscription_id,
                name: 'Calendar.ai Subscription',
                description: `Calendar.ai - ${planId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
                image: 'https://t4.ftcdn.net/jpg/10/33/68/61/360_F_1033686185_RvraYXkGXH40OtR1nhmmQaIIbQQqHN5m.jpg',
                handler: async function (response: any) {
                    const verificationRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user.uid,
                            planId,
                        }),
                    });

                    const verificationData = await verificationRes.json();
                    if (verificationRes.ok) {
                        toast({ title: 'Success!', description: 'Your subscription is now active.' });
                        await refreshSubscription();
                        router.push('/dashboard');
                    } else {
                        throw new Error(verificationData.error || 'Payment verification failed.');
                    }
                },
                prefill: {
                    name: user.displayName || '',
                    email: user.email || '',
                },
                theme: {
                    color: '#4A6580',
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast({
                    title: 'Payment Failed',
                    description: response.error.description || 'Something went wrong.',
                    variant: 'destructive',
                });
            });
            rzp.open();

        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(null);
        }
    };
    
    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setIsScriptLoaded(true)}
            />
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="font-headline text-3xl md:text-4xl font-semibold text-primary">
                       Upgrade Your Plan
                    </h1>
                    <p className="text-foreground/80 mt-2 max-w-xl mx-auto">
                        Choose the perfect plan for your journey. Prices shown in your local currency ({currency.code}).
                    </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-7xl mx-auto">
                   <PlanSection 
                        type="Student" 
                        icon={GraduationCap} 
                        plans={plans.student} 
                        currency={currency}
                        isLoading={isLoading}
                        onSubscribe={handleSubscribe}
                   />
                   <PlanSection 
                        type="Professional" 
                        icon={Briefcase} 
                        plans={plans.professional} 
                        currency={currency}
                        isLoading={isLoading}
                        onSubscribe={handleSubscribe}
                   />
                </div>

                <Card className="frosted-glass max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold">Can I cancel my subscription?</h4>
                            <p className="text-muted-foreground">Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Is my payment information secure?</h4>
                            <p className="text-muted-foreground">We use Razorpay for payment processing, which is a certified PCI-DSS compliant payment gateway. We do not store any of your card information on our servers.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">What currency will I be charged in?</h4>
                            <p className="text-muted-foreground">Prices are displayed in your local currency for convenience. The actual transaction will be processed in Indian Rupees (INR) at the current exchange rate provided by your bank or card network.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
