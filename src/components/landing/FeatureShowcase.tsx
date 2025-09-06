
'use client';

import { allPlugins } from "@/data/plugins";
import { Flame, LayoutGrid } from "lucide-react";
import Image from "next/image";
import { Card } from "../ui/card";

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

const StreakShowcase = () => (
    <div className="relative h-64 w-full flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
                <div className="absolute -inset-2 bg-amber-500/20 blur-xl rounded-full"></div>
                <Flame className="relative h-24 w-24 text-amber-500" strokeWidth={1} />
            </div>
            <p className="text-5xl font-bold text-white">100K +</p>
            <p className="text-lg text-muted-foreground">Users</p>
            <div className="flex gap-1.5">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-full ${i < 5 ? 'bg-amber-500' : 'bg-muted/50'}`}></div>
                ))}
            </div>
        </div>
    </div>
);

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
