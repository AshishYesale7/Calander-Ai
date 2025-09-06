
import SignUpForm from '@/components/auth/SignUpForm';
import Image from 'next/image';
import { LandingHeader } from '@/components/layout/LandingHeader';

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center md:justify-start p-4 overflow-hidden">
      <LandingHeader />
      <Image
        src="https://r4.wallpaperflare.com/wallpaper/126/117/95/quote-motivational-digital-art-typography-wallpaper-5856bc0a6f2cf779de90d962a2d90bb0.jpg" 
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="-z-10"
        data-ai-hint="mountains nature"
      />
      <Image
        src="https://lolstatic-a.akamaihd.net/frontpage/apps/prod/preseason-2018/pt_BR/a6708b7ae3dbc0b25463f9c8e259a513d2c4c7e6/assets/img/global/level-bg-top.jpg"
        alt="Overlay"
        layout="fill"
        objectFit="cover"
        className="-z-10 opacity-50"
      />
       <div className="w-full max-w-sm mx-auto md:mx-0 md:ml-12 lg:ml-24">
        <SignUpForm />
      </div>
    </div>
  );
}
