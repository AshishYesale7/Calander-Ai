
'use client';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
  countryCode?: string | null;
  className?: string;
}

const CountryFlag = ({ countryCode, className }: CountryFlagProps) => {
  if (!countryCode) {
    return null;
  }

  // Using a reliable flag CDN
  const flagUrl = `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;

  return (
    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center overflow-hidden border border-border bg-background", className)}>
        <Image
            src={flagUrl}
            alt={`${countryCode} flag`}
            width={20}
            height={20}
            className="object-cover"
        />
    </div>
  );
};

export default CountryFlag;
