'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DiscordLogo } from "@/components/logo/DiscordLogo";
import { Link2, Zap, Settings } from "lucide-react";

export default function DiscordDashboard() {
    
    const discordBgStyle = {
        backgroundColor: '#282828',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full w-full" style={discordBgStyle}>
            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-12 text-center">
                    <DiscordLogo className="h-24 w-24 mx-auto text-white drop-shadow-lg" />
                    <h1 className="text-4xl font-bold font-headline text-white/95 mt-4">
                        Discord Integration
                    </h1>
                    <p className="text-white/70 mt-2 max-w-lg mx-auto">Turn conversations into actions. Create events and get reminders directly in Discord.</p>
                </header>

                <div className="space-y-8">
                    <Card className="frosted-glass bg-white/5 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-primary text-xl">Connection Status</CardTitle>
                                <CardDescription>Manage your Discord connection.</CardDescription>
                            </div>
                            <Button variant="secondary" className="bg-white/90 text-black hover:bg-white">
                                <Link2 className="mr-2 h-4 w-4" /> Connect to Discord
                            </Button>
                        </CardHeader>
                    </Card>

                    <Card className="frosted-glass bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                               <Settings className="text-accent" /> Bot Settings
                            </CardTitle>
                            <CardDescription>
                                Choose a server and configure how the bot interacts with you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-40 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                                <p className="font-semibold text-white/80">Connect First</p>
                                <p className="text-sm text-white/50 mt-1">Connect to Discord to manage your bot settings.</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="frosted-glass bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                               <Zap className="text-accent"/> Recent Activity
                            </CardTitle>
                            <CardDescription>
                                A log of recent events created from Discord.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="h-32 flex items-center justify-center text-center text-white/40">
                                <p>Once connected, events you create via Discord will appear here.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
