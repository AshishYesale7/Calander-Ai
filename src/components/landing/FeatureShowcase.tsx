
'use client';

import { allPlugins } from "@/data/plugins";
import { Flame, LayoutGrid } from "lucide-react";
import Image from "next/image";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";

const ShowcaseCard = ({ icon: Icon, title, description, children }: { icon: React.ElementType, title: string, description: string, children: React.ReactNode }) => (
    <div className="relative p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-card/80 to-card/60 border border-border/30 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accent/10 rounded-lg">
                <Icon className="h-6 w-6 text-accent" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-primary">{title}</h3>
                <p className="text-foreground/70">{description}</p>
            </div>
        </div>
        {children}
    </div>
);

const AnimatedPluginGrid = () => (
    <div className="relative h-64 w-full max-w-lg mx-auto mask-gradient-lr">
        <div className="absolute inset-0 flex flex-col gap-4 animate-scroll-vertical">
            {[...allPlugins, ...allPlugins].slice(0, 16).map((plugin, index) => (
                <div key={index} className="flex gap-4">
                    {allPlugins.slice(index % 4, (index % 4) + 4).map((p, i) => {
                         const LogoComponent = p.logo;
                         return (
                             <div key={i} className="w-16 h-16 bg-card/80 p-3 rounded-2xl border border-border/20 shadow-md flex items-center justify-center">
                                {typeof LogoComponent === 'string' ? (
                                    <Image src={LogoComponent} alt={p.name} width={36} height={36} className="object-contain" />
                                ) : (
                                    <LogoComponent className="h-9 w-9 text-foreground" />
                                )}
                            </div>
                         )
                    })}
                </div>
            ))}
        </div>
    </div>
);

const DailyFlameIcon = ({ isComplete, className }: { isComplete: boolean, className?: string }) => (
    <svg height="32px" width="32px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 388.219 388.219" xmlSpace="preserve" className={className}>
        <g style={{ filter: isComplete ? 'none' : 'grayscale(80%) opacity(50%)' }}>
            <path style={{fill: '#FF793B'}} d="M160.109,182.619c0.8,6.8-6,11.6-12,8c-22-12.8-32.8-36.4-47.2-56.8c-23.2,36.8-40.8,72.4-40.8,110.4 c0,77.2,54.8,136,132,136s136-58.8,136-136c0-96.8-101.2-113.6-100-236C187.309,37.019,148.909,101.419,160.109,182.619z"></path>
            <path style={{fill: '#C6490F'}} d="M192.109,388.219c-81.2,0-140-60.4-140-144c0-42,20.4-80,42-114.8c1.6-2.4,4-3.6,6.4-3.6 c2.8,0,5.2,1.2,6.8,3.2c3.6,4.8,6.8,10,10,15.2c10,15.6,19.6,30.4,34.8,39.2l0,0c-11.6-82.8,27.6-151.2,71.2-182 c2.4-1.6,5.6-2,8.4-0.4c2.8,1.2,4.4,4,4.4,7.2c-0.8,62,26.4,96,52.4,128.4c23.6,29.2,47.6,59.2,47.6,107.6 C336.109,326.219,274.109,388.219,192.109,388.219z M101.309,148.619c-18,29.6-33.2,61.6-33.2,95.6c0,74,52,128,124,128 c72.8,0,128-55.2,128-128c0-42.8-20.4-68-44-97.6c-24.4-30.4-51.6-64.4-55.6-122c-34.4,31.2-62,88.4-52.4,156.8l0,0 c0.8,6.4-2,12.4-7.2,15.6c-5.2,3.2-11.6,3.2-16.8,0c-18.4-10.8-29.2-28-40-44.4C102.909,151.419,102.109,150.219,101.309,148.619z"></path>
            <path style={{fill: '#FF793B'}} d="M278.109,304.219c14-21.6,22-47.6,22-76"></path>
            <path style={{fill: '#C6490F'}} d="M278.109,312.219c-1.6,0-3.2-0.4-4.4-1.2c-3.6-2.4-4.8-7.2-2.4-11.2c13.6-20.8,20.8-45.6,20.8-71.6 c0-4.4,3.6-8,8-8s8,3.6,8,8c0,29.2-8,56.8-23.2,80.4C283.309,311.019,280.909,312.219,278.109,312.219z"></path>
            <path style={{fill: '#FF793B'}} d="M253.709,332.219c2.8-2.4,6-5.2,8.4-8"></path>
            <path style={{fill: '#C6490F'}} d="M253.709,340.219c-2.4,0-4.4-0.8-6-2.8c-2.8-3.2-2.4-8.4,0.8-11.2c2.4-2.4,5.6-4.8,7.6-7.2 c2.8-3.2,8-3.6,11.2-0.8c3.2,2.8,3.6,8,0.8,11.2c-2.8,3.2-6.4,6.4-9.2,8.8C257.309,339.419,255.709,340.219,253.709,340.219z"></path>
        </g>
    </svg>
);


const StreakShowcase = () => {
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const progress = [true, true, true, true, false, true, false]; // Example progress

    return (
        <div className="relative h-64 w-full flex items-center justify-center">
            <div className="relative flex flex-col items-center gap-4">
                <h4 className="text-xl font-bold text-white">Build Your Streak</h4>
                <div className="flex justify-around gap-2 sm:gap-4 p-4 bg-black/25 rounded-2xl border border-white/10">
                    {weekDays.map((dayChar, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <span className="text-sm font-semibold text-white/70">{dayChar}</span>
                            <div className="h-9 w-9 flex items-center justify-center">
                                <DailyFlameIcon isComplete={progress[index]} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function FeatureShowcase() {
  return (
    <section id="showcase" className="py-20 md:py-32 relative z-10">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl md:text-5xl font-bold font-headline text-primary">Extend Your Workflow</h2>
                <p className="mt-4 text-lg text-foreground/80">
                    Integrate your favorite tools with our plugin marketplace and build powerful habits with streak tracking.
                </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <ShowcaseCard
                    icon={LayoutGrid}
                    title="Plugin Marketplace"
                    description="Connect with the tools you already use."
                >
                    <AnimatedPluginGrid />
                </ShowcaseCard>
                <ShowcaseCard
                    icon={Flame}
                    title="Daily Streaks"
                    description="Stay motivated and build consistency."
                >
                    <StreakShowcase />
                </ShowcaseCard>
            </div>
        </div>
    </section>
  );
}
