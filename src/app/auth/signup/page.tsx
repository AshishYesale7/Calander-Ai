
import SignUpForm from '@/components/auth/SignUpForm';
import Image from 'next/image';
import { LandingHeader } from '@/components/layout/LandingHeader';

const avatarImages = [
    'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740',
    'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436185.jpg?w=740',
    'https://img.freepik.com/free-psd/3d-illustration-person-with-green-hoodie_23-2149436191.jpg?w=740',
    'https://img.freepik.com/free-psd/3d-illustration-person_23-2149436192.jpg?w=740',
    'https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436190.jpg?w=740',
    'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?w=740',
    'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671140.jpg?w=740',
];

export default function SignUpPage() {
  const randomAvatar = avatarImages[Math.floor(Math.random() * avatarImages.length)];

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
       <div className="w-full max-w-sm mx-auto md:mx-0 md:ml-12 lg:ml-24">
        <SignUpForm avatarUrl={randomAvatar} />
      </div>
    </div>
  );
}
