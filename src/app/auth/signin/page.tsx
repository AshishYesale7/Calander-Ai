
import SignInForm from '@/components/auth/SignInForm';
import Image from 'next/image';
import { LandingHeader } from '@/components/layout/LandingHeader';

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <LandingHeader />
      <Image
        src="https://r4.wallpaperflare.com/wallpaper/126/117/95/quote-motivational-digital-art-typography-wallpaper-5856bc0a6f2cf779de90d962a2d90bb0.jpg"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="-z-10"
        data-ai-hint="mountains sky"
      />
      <div className="w-full max-w-sm">
        <SignInForm />
      </div>
    </div>
  );
}
