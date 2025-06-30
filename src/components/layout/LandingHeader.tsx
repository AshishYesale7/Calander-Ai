'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export const LandingHeader = () => {
    const pathname = usePathname();
    const isSigningIn = pathname === '/auth/signin';
    const isSigningUp = pathname === '/auth/signup';

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="landing-header-glassy">
                <Link href="/" className="flex items-center gap-2 px-3 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    <h1 className="font-headline text-lg font-semibold text-white/90 hidden sm:block">FutureSight</h1>
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
                </div>
            </div>
        </header>
    );
};
