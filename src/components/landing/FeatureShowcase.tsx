
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

const TrophyFlameIcon = ({ isComplete, className }: { isComplete: boolean, className?: string }) => (
    <svg height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve" className={className}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <g style={{ filter: isComplete ? 'none' : 'grayscale(100%)' }}>
                <path style={{fill:'#971D2E'}} d="M34.595,462.184c0,27.51,22.307,49.816,49.816,49.816h343.178v-33.211L34.595,462.184z"></path>
                <path style={{fill:'#BE2428'}} d="M427.589,412.368v66.422H84.411c-27.51,0-49.816-7.439-49.816-16.605 c0-27.51,22.307-49.816,49.816-49.816H427.589z"></path>
                <path style={{fill:'#FFD46E'}} d="M427.589,412.368V512c27.51,0,49.816-22.307,49.816-49.816 C477.405,434.674,455.099,412.368,427.589,412.368z"></path>
                <path style={{fill:'#FFE9B7'}} d="M427.589,412.368c9.166,0,16.605,22.307,16.605,49.816c0,27.51-7.439,49.816-16.605,49.816 c-27.51,0-49.816-22.307-49.816-49.816C377.773,434.674,400.08,412.368,427.589,412.368z"></path>
                <path style={{fill:'#EC5123'}} d="M401.939,205.099L353.562,60.355l-18,11.037l-77.99,340.964 c84.876-0.841,153.412-69.898,153.412-154.973C410.984,239.04,407.796,221.439,401.939,205.099z"></path>
                <path style={{fill:'#F27524'}} d="M370.666,205.099c4.594,16.34,7.107,33.941,7.107,52.285c0,84.931-53.669,153.899-120.201,154.973 c-0.52,0.011-1.052,0.011-1.572,0.011c-85.595,0-154.984-69.388-154.984-154.984c0-18.343,3.188-35.945,9.044-52.285l48.377-144.744 l37.772,23.17L256,8.303l59.791,75.222l19.771-12.133L370.666,205.099z"></path>
                <path style={{fill:'#FFD46E'}} d="M325.488,202.475L256,115.053v230.893c48.831,0,88.562-39.731,88.562-88.562 C344.562,237.192,337.953,218.195,325.488,202.475z"></path>
                <path style={{fill:'#FFE9B7'}} d="M299.429,202.475c7.793,15.72,11.923,34.716,11.923,54.909c0,48.831-24.831,88.562-55.351,88.562 c-48.831,0-88.562-39.731-88.562-88.562c0-20.192,6.609-39.189,19.118-54.953L256,115.053L299.429,202.475z"></path>
                <g> <circle style={{fill:'#EC5123'}} cx="444.195" cy="257.384" r="8.303"></circle> <circle style={{fill:'#EC5123'}} cx="315.791" cy="131.371" r="8.303"></circle> </g>
                <g> <circle style={{fill:'#F27524'}} cx="158.438" cy="8.303" r="8.303"></circle> <circle style={{fill:'#F27524'}} cx="67.805" cy="257.384" r="8.303"></circle> <circle style={{fill:'#F27524'}} cx="67.805" cy="224.173" r="8.303"></circle> </g>
                <g> <circle style={{fill:'#FFD46E'}} cx="256" cy="224.173" r="8.303"></circle> <circle style={{fill:'#FFD46E'}} cx="289.211" cy="257.384" r="8.303"></circle> </g>
            </g>
        </g>
    </svg>
);


const StreakShowcase = () => {
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const progress = [true, true, true, true, false, true, false]; // Example progress

    return (
        <div className="relative h-64 w-full flex items-center justify-center">
            <TrophyFlameIcon isComplete={true} className="absolute inset-0 h-full w-full opacity-10" />
            <div className="relative flex flex-col items-center gap-4">
                <h4 className="text-xl font-bold text-white">Build Your Streak</h4>
                <div className="flex justify-center gap-2 sm:gap-3 p-3 bg-black/25 rounded-2xl border border-white/10">
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
