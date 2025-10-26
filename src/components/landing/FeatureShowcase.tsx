
'use client';

import { allPlugins } from "@/data/plugins";
import { Flame, LayoutGrid, Brain, Target, Users, Bot, Briefcase, BarChart, Shield } from "lucide-react";
import Image from "next/image";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ShowcaseCard = ({ icon: Icon, title, description, children }: { icon: React.ElementType, title: string, description: string, children: React.ReactNode }) => (
    <div className="relative p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-card/80 to-card/60 border border-border/30 shadow-2xl h-full flex flex-col">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accent/10 rounded-lg">
                <Icon className="h-6 w-6 text-accent" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-primary">{title}</h3>
                <p className="text-foreground/70">{description}</p>
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
            {children}
        </div>
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
    <svg viewBox="0 0 388.219 388.219" xmlns="http://www.w3.org/2000/svg" className={cn("h-7 w-7", className)}>
        <g style={{ filter: isComplete ? 'none' : 'grayscale(80%) opacity(60%)' }}>
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
    const progress = [true, true, true, true, false, true, false];

    return (
    <div className="relative h-64 w-full flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
                <div className="absolute -inset-2 bg-amber-500/20 blur-xl rounded-full"></div>
                <Flame className="relative h-12 w-12 text-amber-500" strokeWidth={1} />
            </div>
            <h4 className="text-xl font-bold text-white">Build Your Streak</h4>
            <div className="flex justify-center gap-2 p-2 bg-black/25 rounded-xl border border-white/10">
                {weekDays.map((dayChar, index) => (
                    <div key={index} className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-white/70">{dayChar}</span>
                        <div className="h-8 w-8 flex items-center justify-center">
                            <DailyFlameIcon isComplete={progress[index]} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
    );
};

const ClanShowcase = () => {
  const memberPositions = [
    { angle: 30, distance: 80, size: 32 },
    { angle: 90, distance: 90, size: 40 },
    { angle: 150, distance: 80, size: 32 },
    { angle: 210, distance: 80, size: 32 },
    { angle: 270, distance: 90, size: 40 },
    { angle: 330, distance: 80, size: 32 },
  ];
  return (
    <div className="relative h-64 w-full flex items-center justify-center">
      <div className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 bg-accent/10 rounded-full blur-2xl"></div>
        <div className="relative h-28 w-28 bg-card/80 rounded-full flex items-center justify-center border-2 border-accent/30 shadow-lg">
          <Users className="h-14 w-14 text-accent" />
        </div>
        {memberPositions.map((pos, index) => (
          <Avatar
            key={index}
            className="absolute border-2 border-background"
            style={{
              width: pos.size,
              height: pos.size,
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${pos.distance * Math.cos(pos.angle * Math.PI / 180)}px, ${pos.distance * Math.sin(pos.angle * Math.PI / 180)}px)`,
            }}
          >
            <AvatarImage src={`https://placehold.co/64x64/7e22ce/FFFFFF/png?text=${"U" + (index+1)}`} alt={`Member ${index + 1}`} />
            <AvatarFallback>U{index + 1}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  );
};


export default function FeatureShowcase() {
  return (
    <section id="showcase" className="py-20 md:py-32 relative z-10">
        <div className="container mx-auto px-4">
            <Tabs defaultValue="student">
                <div className="flex justify-center mb-10">
                    <TabsList className="bg-muted p-2 border border-border/30">
                        <TabsTrigger value="student" className="px-8 py-3 text-base">For Students</TabsTrigger>
                        <TabsTrigger value="professional" className="px-8 py-3 text-base">For Professionals</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="student">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold font-headline text-primary">Accelerate Your Student Journey</h2>
                        <p className="mt-4 text-lg text-foreground/80">
                            Tools designed to help you excel in your studies, build skills, and launch your career.
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
                        <ShowcaseCard
                            icon={Users}
                            title="Form Your Clan"
                            description="Collaborate on projects, startups, and hackathons."
                        >
                            <ClanShowcase />
                        </ShowcaseCard>
                        <ShowcaseCard
                            icon={Target}
                            title="Career Goal Tracking"
                            description="Set goals and monitor your progress."
                        >
                            <div className="relative h-64 w-full flex items-center justify-center text-foreground/50">
                                <p>Goal Tracking Visualization Here</p>
                            </div>
                        </ShowcaseCard>
                    </div>
                </TabsContent>
                <TabsContent value="professional">
                     <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold font-headline text-primary">Supercharge Your Professional Workflow</h2>
                        <p className="mt-4 text-lg text-foreground/80">
                           Advanced features to boost productivity, enhance team collaboration, and automate your work life.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <ShowcaseCard
                            icon={Bot}
                            title="AI Meeting Assistant"
                            description="Automated summaries, action items, and follow-ups."
                        >
                             <div className="relative h-64 w-full flex items-center justify-center text-foreground/50">
                                <p>Meeting Assistant Visualization Here</p>
                            </div>
                        </ShowcaseCard>
                        <ShowcaseCard
                            icon={BarChart}
                            title="Team Productivity Dashboards"
                            description="Visualize team workload and project progress."
                        >
                            <div className="relative h-64 w-full flex items-center justify-center text-foreground/50">
                                <p>Dashboard Visualization Here</p>
                            </div>
                        </ShowcaseCard>
                        <ShowcaseCard
                            icon={Shield}
                            title="Focus Time Automation"
                            description="Intelligently block out deep work sessions."
                        >
                            <div className="relative h-64 w-full flex items-center justify-center text-foreground/50">
                                <p>Focus Time Visualization Here</p>
                            </div>
                        </ShowcaseCard>
                        <ShowcaseCard
                            icon={Brain}
                            title="Intelligent Document Hub"
                            description="Connects Drive, Notion, and Slack to your calendar."
                        >
                             <div className="relative h-64 w-full flex items-center justify-center text-foreground/50">
                                <p>Document Hub Visualization Here</p>
                            </div>
                        </ShowcaseCard>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </section>
  );
}
