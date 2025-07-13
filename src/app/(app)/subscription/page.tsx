
'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

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
    monthly: {
        id: 'monthly',
        title: 'Monthly Plan',
        priceINR: 59,
        priceSuffix: '/ month',
        features: ['Access to all AI features', 'Unlimited timeline events', 'Personalized news feed', 'Email support'],
    },
    yearly: {
        id: 'yearly',
        title: 'Yearly Plan',
        priceINR: 599,
        priceSuffix: '/ year',
        features: ['All features from Monthly', 'Save 20% with annual billing', 'Priority support', 'Early access to new features'],
    },
};

type PlanID = keyof typeof plans;

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
                // Default to INR if API fails
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
        // Round up to the nearest whole number, then subtract 0.01 to get a ".99" figure
        const rounded = Math.ceil(converted) - 0.01;
        return rounded.toFixed(2);
    };

    const handleSubscribe = async (planId: PlanID) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to subscribe.', variant: 'destructive' });
            return;
        }

        if (!isScriptLoaded) {
            toast({ title: 'Payment Service Unavailable', description: 'Could not connect to the payment provider. Please check your internet connection and try again.', variant: 'destructive' });
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

            const options = {
                key: data.key_id,
                subscription_id: data.subscription_id,
                name: 'Carrer Calander Subscription',
                description: `Carrer Calander - ${plans[planId].title}`,
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
                    color: '#4A6580', // Deep slate blue
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

    const PriceDisplay = ({ plan }: { plan: { priceINR: number } }) => {
        if (isCurrencyLoading) {
            return <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />;
        }
        return <span className="text-3xl font-bold text-foreground">{currency.symbol}{convertAndFormatPrice(plan.priceINR)}</span>;
    };
    
    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setIsScriptLoaded(true)}
            />
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
                       <Crown className="mr-3 h-8 w-8 text-accent"/> Manage Subscription
                    </h1>
                    <p className="text-foreground/80 mt-1">
                        Choose a plan that fits your needs. Prices shown in your local currency ({currency.code}).
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {(Object.keys(plans) as PlanID[]).map((planId) => {
                        const plan = plans[planId];
                        const isPopular = planId === 'yearly';
                        return (
                            <Card key={plan.id} className={isPopular ? 'frosted-glass shadow-lg border-accent' : 'frosted-glass'}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="font-headline text-2xl text-primary">{plan.title}</CardTitle>
                                      {isPopular && <Badge variant="default" className="bg-accent text-accent-foreground">Most Popular</Badge>}
                                    </div>
                                    <CardDescription>
                                        <PriceDisplay plan={plan} />
                                        <span className="text-muted-foreground">{plan.priceSuffix}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-foreground/90">
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                                        disabled={isLoading !== null || !isScriptLoaded || isCurrencyLoading}
                                        onClick={() => handleSubscribe(planId)}
                                    >
                                        {isLoading === planId ? (
                                            <>
                                                <LoadingSpinner size="sm" className="mr-2"/>
                                                Processing...
                                            </>
                                        ) : !isScriptLoaded || isCurrencyLoading ? (
                                            <>
                                                <LoadingSpinner size="sm" className="mr-2"/>
                                                Loading...
                                            </>
                                        ) : 'Subscribe Now'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                <Card className="frosted-glass">
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
