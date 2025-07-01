
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';

export const LandingHeader = () => {
    const pathname = usePathname();
    const isSigningIn = pathname === '/auth/signin';
    const isSigningUp = pathname === '/auth/signup';

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="landing-header-glassy">
                <Link href="/" className="flex items-center gap-2 px-3 shrink-0">
                    <CalendarAiLogo />
                    <h1 className="font-headline text-lg font-semibold text-white/90 hidden sm:block">Calendar.ai</h1>
                </Link>
                <div className="h-6 w-px bg-white/20 hidden md:block"></div>
                <nav className="hidden md:flex items-center gap-1">
                    <Link href="/#features" className="landing-header-link">Features</Link>
                    <Link href="/#pricing" className="landing-header-link">Pricing</Link>
                    <Link href="/#contact" className="landing-header-link">Contact</Link>
                </nav>
                <div className="flex items-center gap-1">
                     {!isSigningIn && (
                        <Button asChild variant="ghost" className="landing-header-link hidden md:inline-flex">
                            <Link href="/auth/signin">Login</Link>
                        </Button>
                    )}
                    {!isSigningUp && (
                        <Button asChild className="bg-white/10 text-white hover:bg-white/20 rounded-full px-4 py-1.5 h-auto text-sm shrink-0">
                            <Link href="/auth/signup">Sign Up</Link>
                        </Button>
                    )}
                    
                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="bg-background/80 backdrop-blur-xl border-l-border/30 text-foreground w-[250px] p-6 flex flex-col">
                                <SheetHeader className="sr-only">
                                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-6 text-lg mt-8">
                                    <Link href="/" className="hover:text-primary font-semibold">Home</Link>
                                    <Link href="/#features" className="hover:text-primary">Features</Link>
                                    <Link href="/#pricing" className="hover:text-primary">Pricing</Link>
                                    <Link href="/#contact" className="hover:text-primary">Contact</Link>
                                </nav>
                                <div className="mt-auto">
                                    {!isSigningIn && (
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href="/auth/signin">Login</Link>
                                        </Button>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};
